import { ethers, Contract, Signer, Provider } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import { loadBb } from "./bb";
import { merkleTree } from "./merkleTree";
import bundledCircuit from "./circuits.json";
import {
  generateCommitment,
  computeNullifierHash,
  computeCommitment,
  computeContextBoundCommitment,
} from "./utils";

export interface DepositResult {
  secret: string;
  nullifier: string;
  commitment: string;
  txHash: string;
}

export interface ExecutionResult {
  txHash: string;
  newSecret: string;
  newNullifier: string;
  newCommitment: string;
  proxyAddress?: string;
}

export interface ActionRequest {
  token: string;
  amount: string | number | bigint;
  target: string;
  data: string;
  actionId: string;
  nullifierHash: string;
  proof: string;
  rootHash: string;
  newCommitment: string;
}

export interface PrivateTransactionDetails {
  txHash: string;
  initiator: string;
  gasPayer: string;
  method: string;
  methodId: string;
  parameters: string;
  privacyLevel: "Private";
  gasUsed: string | null;
  status: "pending" | "success" | "reverted";
  to: string | null;
}

export const DEFAULT_PRIVACY_PROTOCOL_CIRCUIT = bundledCircuit;

const PRIVACY_PROTOCOL_POOL_ABI = [
  "function deposit(address token, uint256 amount, bytes32 commitment) external",
  "function withdraw(address token, address recipient, uint256 amount, bytes32 nullifierHash, bytes calldata proof, bytes32 rootHash, bytes32 calldataHash, bytes32 newCommitment) external",
  "function executeAction((address token, uint256 amount, address target, bytes data, bytes32 actionId, bytes32 nullifierHash, bytes proof, bytes32 rootHash, bytes32 newCommitment) request) external returns (bool success)",
  "event PrivacyProtocolPool__Deposit(address indexed token, bytes32 indexed commitment, uint256 indexed amount, uint32 insertedLeafIndex, uint256 timestamp)",
  "event PrivacyProtocolPool__Withdrawal(bytes32 indexed newCommitment, address indexed recipient, address indexed token, uint256 amount, uint32 insertedLeafIndex, uint256 timestamp)",
  "event PrivacyProtocolPool__ActionExecuted(bytes32 nullifierHash, address proxy)",
];

export class PrivacyProtocolSDK {
  provider: Provider;
  contractAddress: string;
  circuit: any;
  contract: Contract;

  constructor(
    provider: Provider,
    contractAddress: string,
    circuit: any = DEFAULT_PRIVACY_PROTOCOL_CIRCUIT,
  ) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.circuit = circuit;
    this.contract = new ethers.Contract(
      contractAddress,
      PRIVACY_PROTOCOL_POOL_ABI,
      provider,
    );
  }

  connect(signer: Signer): Contract {
    return this.contract.connect(signer) as Contract;
  }

  async deposit(
    token: string,
    amount: string | number | bigint,
    signer: Signer,
  ): Promise<DepositResult> {
    const { secret, nullifier, commitment } = await generateCommitment(amount);

    const commitmentHex =
      "0x" + Buffer.from(commitment.toBuffer()).toString("hex");
    const tx = await this.connect(signer).getFunction("deposit")(
      token,
      amount,
      commitmentHex,
    );

    return {
      secret: "0x" + Buffer.from(secret.toBuffer()).toString("hex"),
      nullifier: "0x" + Buffer.from(nullifier.toBuffer()).toString("hex"),
      commitment: commitmentHex,
      txHash: tx.hash,
    };
  }

  async withdraw(
    token: string,
    recipient: string,
    amount: string | number | bigint,
    secret: string,
    nullifier: string,
    amountInPool: string | number | bigint,
    leaves: string[],
    signer: Signer,
  ): Promise<ExecutionResult> {
    const dataHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const { proof, newCommitment, newNullifier, rootHash, nullifierHash } =
      await this._generateProof(
        secret,
        nullifier,
        amountInPool,
        amount,
        recipient,
        dataHash,
        leaves,
      );

    const tx = await this.connect(signer).getFunction("withdraw")(
      token,
      recipient,
      amount,
      nullifierHash,
      new Uint8Array(Buffer.from(proof.slice(2), "hex")), // Convert hex string back to bytes for ethers
      rootHash,
      dataHash,
      newCommitment,
    );

    return {
      txHash: tx.hash,
      newSecret: secret,
      newNullifier: newNullifier,
      newCommitment: newCommitment,
    };
  }

  async executeAction(
    token: string,
    amount: string | number | bigint,
    target: string,
    data: string,
    actionId: string,
    secret: string,
    nullifier: string,
    amountInPool: string | number | bigint,
    leaves: string[],
    signer: Signer,
  ): Promise<ExecutionResult> {
    const expectedActionId = ethers.keccak256(ethers.getBytes(secret));
    if (actionId.toLowerCase() !== expectedActionId.toLowerCase()) {
      throw new Error(
        "Invalid actionId: expected keccak256(secret) to allow proxy withdrawal",
      );
    }

    const fullHash = ethers.keccak256(
      ethers.concat([ethers.getBytes(actionId), ethers.getBytes(data)]),
    );
    const hashBigInt = BigInt(fullHash);
    const truncatedHashBigInt = hashBigInt >> 8n;
    let truncatedHashHex = truncatedHashBigInt.toString(16);
    while (truncatedHashHex.length < 64) {
      truncatedHashHex = "0" + truncatedHashHex;
    }
    const dataHash = "0x" + truncatedHashHex;

    const { proof, newCommitment, newNullifier, rootHash, nullifierHash } =
      await this._generateProof(
        secret,
        nullifier,
        amountInPool,
        amount,
        target,
        dataHash,
        leaves,
      );

    const request: ActionRequest = {
      token,
      amount,
      target,
      data,
      actionId,
      nullifierHash,
      proof,
      rootHash,
      newCommitment,
    };

    const tx = await this.connect(signer).getFunction("executeAction")(request);
    const receipt = await tx.wait();

    let proxyAddress: string | undefined;

    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog(log as any);
          if (
            parsedLog &&
            parsedLog.name === "PrivacyProtocolPool__ActionExecuted"
          ) {
            proxyAddress = parsedLog.args.proxy;
            break;
          }
        } catch (e) {}
      }
    }

    return {
      txHash: tx.hash,
      newSecret: secret,
      newNullifier: newNullifier,
      newCommitment: newCommitment,
      proxyAddress,
    };
  }

  async getPrivateTransactionDetails(
    txHash: string,
  ): Promise<PrivateTransactionDetails> {
    const tx = await this.provider.getTransaction(txHash);

    if (!tx) {
      throw new Error(`Transaction not found for hash: ${txHash}`);
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    const methodId = tx.data ? tx.data.slice(0, 10) : "0x";

    let methodName = "verifyProof";
    try {
      const parsedTx = this.contract.interface.parseTransaction({
        data: tx.data,
      });
      if (parsedTx?.name) {
        methodName = parsedTx.name;
      }
    } catch {}

    return {
      txHash,
      initiator: tx.from,
      gasPayer: tx.from,
      method: `${methodName} (${methodId})`,
      methodId,
      parameters: tx.data,
      privacyLevel: "Private",
      gasUsed: receipt?.gasUsed?.toString() ?? null,
      status: receipt
        ? receipt.status === 1
          ? "success"
          : "reverted"
        : "pending",
      to: tx.to,
    };
  }

  async _generateProof(
    secret: string,
    nullifier: string,
    amountInPool: string | number | bigint,
    amountToWithdraw: string | number | bigint,
    externalAddress: string,
    dataHash: string,
    leaves: string[],
  ) {
    const bbModule = await loadBb();
    const Fr = bbModule.Fr;
    const UltraHonkBackend = bbModule.UltraHonkBackend;

    const amountLeft = BigInt(amountInPool) - BigInt(amountToWithdraw);

    const commitment = await computeCommitment(nullifier, secret, amountInPool);

    const tree = await merkleTree(leaves);
    const index = tree.getIndex(commitment.toString());

    if (index === -1) {
      throw new Error("Commitment not found in tree");
    }

    const merkleProof = tree.proof(index);

    const nullifierHash = await computeNullifierHash(nullifier);

    const newNullifier = Fr.random();
    const newCommitment = await computeContextBoundCommitment(
      newNullifier,
      secret,
      amountLeft,
      externalAddress,
      dataHash,
    );

    if (!this.circuit) {
      throw new Error("Circuit not provided to SDK");
    }

    const noir = new Noir(this.circuit);
    const honk = new UltraHonkBackend(this.circuit.bytecode, { threads: 1 });

    const input = {
      root_hash: merkleProof.root.toString(),
      nullifier_hash: nullifierHash.toString(),
      recipient_address: externalAddress,
      data_hash: dataHash,
      amount_to_withdraw: amountToWithdraw.toString(),
      new_commitment: newCommitment.toString(),
      nullifier: Fr.fromString(nullifier).toString(),
      new_nullifier: newNullifier.toString(),
      secret: Fr.fromString(secret).toString(),
      amount_in_pool: amountInPool.toString(),
      amount_left: amountLeft.toString(),
      merkle_proof: merkleProof.pathElements.map((e) => e.toString()),
      is_even: merkleProof.pathIndices.map((i) => i % 2 === 0),
    };

    const { witness } = await noir.execute(input);
    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true,
    });

    return {
      proof: "0x" + Buffer.from(proof).toString("hex"),
      publicInputs,
      newCommitment:
        "0x" + Buffer.from(newCommitment.toBuffer()).toString("hex"),
      newNullifier: "0x" + Buffer.from(newNullifier.toBuffer()).toString("hex"),
      rootHash: merkleProof.root.toString(),
      nullifierHash:
        "0x" + Buffer.from(nullifierHash.toBuffer()).toString("hex"),
    };
  }

  async getLeaves(fromBlock: number = 0): Promise<string[]> {
    const depositFilter = this.contract.filters.PrivacyProtocolPool__Deposit();
    const withdrawalFilter =
      this.contract.filters.PrivacyProtocolPool__Withdrawal();

    const [deposits, withdrawals] = await Promise.all([
      this.contract.queryFilter(depositFilter, fromBlock),
      this.contract.queryFilter(withdrawalFilter, fromBlock),
    ]);

    const events = [...deposits, ...withdrawals].sort((a: any, b: any) => {
      if (a.blockNumber === b.blockNumber) {
        return a.transactionIndex - b.transactionIndex;
      }
      return a.blockNumber - b.blockNumber;
    });

    const leafMap = new Map<number, string>();

    deposits.forEach((e: any) => {
      leafMap.set(Number(e.args.insertedLeafIndex), e.args.commitment);
    });

    withdrawals.forEach((e: any) => {
      leafMap.set(Number(e.args.insertedLeafIndex), e.args.newCommitment);
    });

    const sortedIndices = Array.from(leafMap.keys()).sort((a, b) => a - b);
    const leaves = sortedIndices.map((i) => leafMap.get(i)!);

    return leaves;
  }
}
