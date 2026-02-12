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

export interface RelayerTransportConfig {
  url: string;
  endpoint?: string;
  headers?: Record<string, string>;
  relayerPublicInputIndex?: number;
  relayerAddress?: string;
  feePublicInputIndex?: number;
  relayerFeeWei?: string | number | bigint;
  metadata?: Record<string, unknown>;
}

export interface PrivacyProtocolSDKOptions {
  relayer?: RelayerTransportConfig;
}

export interface ExecutionCallOptions {
  relayerPublicInputIndex?: number;
  relayerAddress?: string;
  feePublicInputIndex?: number;
  relayerFeeWei?: string | number | bigint;
  relayMetadata?: Record<string, unknown>;
}

interface RelayQueuedResponseWire {
  request_id: string;
  queue_len: number;
  gas_estimate: string;
  min_required_fee_wei: string;
}

interface RelayStatusResponseWire {
  request_id: string;
  status: "queued" | "submitted";
  tx_hash?: string | null;
}

export interface ExecutionResult {
  txHash: string;
  newSecret: string;
  newNullifier: string;
  newCommitment: string;
  proxyAddress?: string;
  relayRequestId?: string;
  relayQueueLength?: number;
  relayGasEstimate?: string;
  relayMinRequiredFeeWei?: string;
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
const ZERO_BYTES32 = "0x" + "00".repeat(32);

interface RelayerFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

type RelayerFetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<RelayerFetchResponse>;

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
  options: PrivacyProtocolSDKOptions;

  constructor(
    provider: Provider,
    contractAddress: string,
    circuit: any = DEFAULT_PRIVACY_PROTOCOL_CIRCUIT,
    options: PrivacyProtocolSDKOptions = {},
  ) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.circuit = circuit;
    this.options = options;
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
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error("Deposit transaction failed");
    }

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
    executionOptions: ExecutionCallOptions = {},
  ): Promise<ExecutionResult> {
    const dataHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const {
      proof,
      publicInputs,
      newCommitment,
      newNullifier,
      rootHash,
      nullifierHash,
    } = await this._generateProof(
      secret,
      nullifier,
      amountInPool,
      amount,
      recipient,
      dataHash,
      leaves,
    );

    const relayResult = await this.submitToRelayer(
      proof,
      publicInputs,
      executionOptions,
      {
        operation: "withdraw",
        token,
        recipient,
        amount: amount.toString(),
        calldataHash: dataHash,
        nullifierHash,
        rootHash,
        newCommitment,
      },
    );

    return {
      txHash: `relay:${relayResult.request_id}`,
      newSecret: secret,
      newNullifier: newNullifier,
      newCommitment: newCommitment,
      relayRequestId: relayResult.request_id,
      relayQueueLength: relayResult.queue_len,
      relayGasEstimate: relayResult.gas_estimate,
      relayMinRequiredFeeWei: relayResult.min_required_fee_wei,
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
    executionOptions: ExecutionCallOptions = {},
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

    const {
      proof,
      publicInputs,
      newCommitment,
      newNullifier,
      rootHash,
      nullifierHash,
    } = await this._generateProof(
      secret,
      nullifier,
      amountInPool,
      amount,
      target,
      dataHash,
      leaves,
    );

    const relayResult = await this.submitToRelayer(
      proof,
      publicInputs,
      executionOptions,
      {
        operation: "executeAction",
        token,
        amount: amount.toString(),
        target,
        data,
        actionId,
        nullifierHash,
        rootHash,
        newCommitment,
      },
    );

    return {
      txHash: `relay:${relayResult.request_id}`,
      newSecret: secret,
      newNullifier: newNullifier,
      newCommitment: newCommitment,
      relayRequestId: relayResult.request_id,
      relayQueueLength: relayResult.queue_len,
      relayGasEstimate: relayResult.gas_estimate,
      relayMinRequiredFeeWei: relayResult.min_required_fee_wei,
    };
  }

  async getPrivateTransactionDetails(
    txHash: string,
  ): Promise<PrivateTransactionDetails> {
    if (txHash.startsWith("relay:")) {
      const requestId = txHash.slice("relay:".length);
      if (requestId) {
        try {
          const relayStatus = await this.fetchRelayStatus(requestId);
          if (relayStatus.status === "submitted" && relayStatus.tx_hash) {
            try {
              return await this.getPrivateTransactionDetails(relayStatus.tx_hash);
            } catch {
              return {
                txHash: relayStatus.tx_hash,
                initiator: "relayer",
                gasPayer: "relayer",
                method: "relay_submission",
                methodId: "relay",
                parameters: "submitted via relayer",
                privacyLevel: "Private",
                gasUsed: null,
                status: "pending",
                to: this.contractAddress,
              };
            }
          }
        } catch {}
      }

      return {
        txHash,
        initiator: "relayer",
        gasPayer: "relayer",
        method: "relay_submission",
        methodId: "relay",
        parameters: "queued via relayer",
        privacyLevel: "Private",
        gasUsed: null,
        status: "pending",
        to: null,
      };
    }

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

  private resolveRelayerStatusEndpoint(requestId: string): string {
    const relayEndpoint = this.resolveRelayerEndpoint();
    const suffix = encodeURIComponent(requestId);
    return relayEndpoint.endsWith("/")
      ? `${relayEndpoint}${suffix}`
      : `${relayEndpoint}/${suffix}`;
  }

  private async fetchRelayStatus(
    requestId: string,
  ): Promise<RelayStatusResponseWire> {
    const fetchFn = this.getRelayerFetch();
    const endpoint = this.resolveRelayerStatusEndpoint(requestId);

    const response = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        ...(this.options.relayer?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch relay status (${response.status})`);
    }

    const body = (await response.json()) as RelayStatusResponseWire;
    if (!body?.request_id || !body?.status) {
      throw new Error("Relayer status response is missing required fields");
    }
    return body;
  }

  private normalizePublicInputWord(word: unknown): string {
    if (typeof word === "string") {
      if (word.startsWith("0x") || word.startsWith("0X")) {
        const normalized = word.slice(2);
        if (normalized.length > 64) {
          throw new Error(`public input exceeds bytes32: ${word}`);
        }
        return `0x${normalized.padStart(64, "0")}`;
      }

      return this.normalizePublicInputWord(BigInt(word));
    }

    if (typeof word === "number") {
      return this.normalizePublicInputWord(BigInt(word));
    }

    if (typeof word === "bigint") {
      if (word < 0n) {
        throw new Error(`public input cannot be negative: ${word.toString()}`);
      }

      const hexValue = word.toString(16);
      if (hexValue.length > 64) {
        throw new Error(`public input exceeds bytes32: ${word.toString()}`);
      }
      return `0x${hexValue.padStart(64, "0")}`;
    }

    if (word instanceof Uint8Array) {
      if (word.length > 32) {
        throw new Error(`public input byte length exceeds 32: ${word.length}`);
      }
      const hexValue = ethers.hexlify(word).slice(2);
      return `0x${hexValue.padStart(64, "0")}`;
    }

    throw new Error(`unsupported public input value type: ${typeof word}`);
  }

  private upsertPublicInputWord(
    words: string[],
    index: number,
    value: string,
  ): void {
    if (index < 0 || !Number.isInteger(index)) {
      throw new Error(`invalid public input index: ${index}`);
    }

    while (words.length <= index) {
      words.push(ZERO_BYTES32);
    }
    words[index] = value;
  }

  private applyRelayerPublicInputs(
    publicInputs: string[],
    options: ExecutionCallOptions = {},
  ): string[] {
    const words = [...publicInputs];
    const relayerConfig = this.options.relayer;

    const relayerIndex =
      options.relayerPublicInputIndex ??
      relayerConfig?.relayerPublicInputIndex ??
      undefined;
    const relayerAddress =
      options.relayerAddress ?? relayerConfig?.relayerAddress ?? undefined;

    if (relayerIndex !== undefined) {
      if (!relayerAddress) {
        throw new Error(
          "Missing relayerAddress for relayerPublicInputIndex. Configure SDK relayer options or pass execution options.",
        );
      }
      const encodedAddress = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [relayerAddress],
      );
      this.upsertPublicInputWord(
        words,
        relayerIndex,
        this.normalizePublicInputWord(encodedAddress),
      );
    }

    const feeIndex =
      options.feePublicInputIndex ?? relayerConfig?.feePublicInputIndex;
    const relayerFeeWei = options.relayerFeeWei ?? relayerConfig?.relayerFeeWei;
    if (feeIndex !== undefined) {
      if (relayerFeeWei === undefined) {
        throw new Error(
          "Missing relayerFeeWei for feePublicInputIndex. Configure SDK relayer options or pass execution options.",
        );
      }

      const encodedFee = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [BigInt(relayerFeeWei)],
      );
      this.upsertPublicInputWord(
        words,
        feeIndex,
        this.normalizePublicInputWord(encodedFee),
      );
    }

    return words;
  }

  private resolveRelayerEndpoint(): string {
    const relayerConfig = this.options.relayer;
    if (!relayerConfig?.url) {
      throw new Error(
        "Relayer URL is not configured. Set options.relayer.url when creating the SDK instance.",
      );
    }

    const endpoint = relayerConfig.endpoint ?? "/relay";
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    const base = relayerConfig.url.endsWith("/")
      ? relayerConfig.url.slice(0, -1)
      : relayerConfig.url;
    const suffix = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${base}${suffix}`;
  }

  private getRelayerFetch(): RelayerFetch {
    const fetchFn = (
      globalThis as unknown as { fetch?: RelayerFetch }
    ).fetch;
    if (typeof fetchFn !== "function") {
      throw new Error(
        "Global fetch is unavailable in this runtime. Provide a fetch-capable environment for relayer transport.",
      );
    }

    return fetchFn;
  }

  private async submitToRelayer(
    proof: string,
    publicInputs: unknown[],
    executionOptions: ExecutionCallOptions,
    operationMetadata: Record<string, unknown>,
  ): Promise<RelayQueuedResponseWire> {
    const fetchFn = this.getRelayerFetch();
    const relayerConfig = this.options.relayer;
    const endpoint = this.resolveRelayerEndpoint();
    if (!Array.isArray(publicInputs)) {
      throw new Error("Proof generation did not return an array of publicInputs");
    }
    const normalizedPublicInputs = publicInputs.map((word) =>
      this.normalizePublicInputWord(word),
    );
    const relayerPublicInputs = this.applyRelayerPublicInputs(
      normalizedPublicInputs,
      executionOptions,
    );

    const metadata: Record<string, unknown> = {
      ...relayerConfig?.metadata,
      ...operationMetadata,
      ...executionOptions.relayMetadata,
    };

    const payload: {
      proof: string;
      public_inputs: string[];
      metadata?: Record<string, unknown>;
    } = {
      proof,
      public_inputs: relayerPublicInputs,
    };

    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }

    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(relayerConfig?.headers ?? {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Relayer request failed with status ${response.status}`;
      try {
        const body = (await response.json()) as { error?: string };
        if (body?.error) {
          errorMessage = `Relayer request failed: ${body.error}`;
        }
      } catch {
        const bodyText = await response.text();
        if (bodyText) {
          errorMessage = `Relayer request failed: ${bodyText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const body = (await response.json()) as RelayQueuedResponseWire;
    if (!body?.request_id) {
      throw new Error("Relayer response is missing request_id");
    }

    return body;
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
    const actionFilter = this.contract.filters.PrivacyProtocolPool__ActionExecuted();

    const [deposits, withdrawals, actions] = await Promise.all([
      this.contract.queryFilter(depositFilter, fromBlock),
      this.contract.queryFilter(withdrawalFilter, fromBlock),
      this.contract.queryFilter(actionFilter, fromBlock),
    ]);

    const events = [...deposits, ...withdrawals, ...actions].sort((a: any, b: any) => {
      if (a.blockNumber === b.blockNumber) {
        if (a.transactionIndex === b.transactionIndex) {
          return a.logIndex - b.logIndex;
        }
        return a.transactionIndex - b.transactionIndex;
      }
      return a.blockNumber - b.blockNumber;
    });

    const leaves: string[] = [];

    for (const event of events as any[]) {
      if (event.fragment?.name === "PrivacyProtocolPool__Deposit") {
        leaves.push(this.normalizePublicInputWord(event.args.commitment));
        continue;
      }

      if (event.fragment?.name === "PrivacyProtocolPool__Withdrawal") {
        leaves.push(this.normalizePublicInputWord(event.args.newCommitment));
        continue;
      }

      if (event.fragment?.name === "PrivacyProtocolPool__ActionExecuted") {
        const tx = await this.provider.getTransaction(event.transactionHash);
        if (!tx?.data) {
          continue;
        }
        const parsed = this.contract.interface.parseTransaction({ data: tx.data });
        if (!parsed || parsed.name !== "executeAction") {
          continue;
        }
        const request = parsed.args?.[0];
        const newCommitment =
          request?.newCommitment ?? request?.[8] ?? undefined;
        if (!newCommitment) {
          continue;
        }
        leaves.push(this.normalizePublicInputWord(newCommitment));
      }
    }

    return leaves;
  }
}
