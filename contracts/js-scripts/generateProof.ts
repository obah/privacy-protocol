import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { Noir } from "@noir-lang/noir_js";
import path from "path";
import fs from "fs";
import { merkleTree } from "./merkleTree";

const circuitPath = path.resolve(
  __dirname,
  "../../circuits/target/circuits.json",
);

const circuit = JSON.parse(fs.readFileSync(circuitPath, "utf8"));

(async () => {
  const bb = await Barretenberg.new();

  const inputs = process.argv.slice(2);

  const nullifier = inputs[0];
  const secret = inputs[1];
  const amountInPool = inputs[2];
  const amountToWithdraw = inputs[3];
  const recipient = inputs[4];
  const dataHash = inputs[5]; // 248-bit truncated keccak256(actionId || calldata) for executeAction
  const leaves = inputs.slice(6);

  const amountLeft = BigInt(amountInPool) - BigInt(amountToWithdraw);

  // Reconstruct the commitment being spent
  const commitment = await bb.poseidon2Hash([
    Fr.fromString(nullifier),
    Fr.fromString(secret),
    new Fr(BigInt(amountInPool)),
  ]);

  const nullifierHash = await bb.poseidon2Hash([Fr.fromString(nullifier)]);

  // Generate new nullifier and new commitment
  const newNullifier = Fr.random();
  const actionContextHash = await bb.poseidon2Hash([
    new Fr(BigInt(recipient)),
    new Fr(BigInt(dataHash)),
  ]);
  const newCommitment = await bb.poseidon2Hash([
    newNullifier,
    Fr.fromString(secret),
    new Fr(amountLeft),
    actionContextHash,
  ]);
  const tree = await merkleTree(leaves);
  const merkleProof = tree.proof(tree.getIndex(commitment.toString()));

  try {
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    const input = {
      //public inputs
      root_hash: merkleProof.root.toString(),
      nullifier_hash: nullifierHash.toString(),
      recipient_address: recipient,
      data_hash: dataHash,
      amount_to_withdraw: amountToWithdraw,
      new_commitment: newCommitment.toString(),
      //private inputs
      nullifier: nullifier,
      new_nullifier: newNullifier.toString(),
      secret: secret,
      amount_in_pool: amountInPool,
      amount_left: amountLeft.toString(),
      merkle_proof: merkleProof.pathElements.map((element) =>
        element.toString(),
      ),
      is_even: merkleProof.pathIndices.map((index) => index % 2 === 0),
    };
    const { witness } = await noir.execute(input);

    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true,
    });

    const result = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes", "bytes32[]", "bytes32"],
      [proof, publicInputs, newNullifier.toBuffer()],
    );

    process.stdout.write(result);
    process.exit(0);
  } catch (error) {
    console.error("DEBUG: Script failed during execution.", error);
    process.exit(1);
  }
})();

// npx tsx js-scripts/generateProof.ts \
//   "0x08dd7b45f81f506ee5c26ed61d6c49d1524b395ca7441c823dc6c789b1c3bd96" \
//   "0x2b1096453832e9b026ba925a7fe0acca5ad53f7554ef9c11a6f3cff791179ac8" \
//   "0x0000000000000000000000000000000000000000000000000000000000000064" \
//   "0x0000000000000000000000000000000000000000000000000000000000000028" \
//   "0x07fe0d0f5990d25c0917f068aaad7c70bef144ef196d56f6b3012991d45d5d56" \
//   "0x0a474b5dd5d8ebb47d1815b4b73468386170f1f036c72f2999fa0f2058bc9371" \
//   "0x043c8ccd1e48408107110d7f588ddcd79f930f010a3559efe4ec9563349dfbd2" \
//   "0x0c0149ac1114d0f63ba3f437ce15ffbd380eef8896e9af596815cd4b6f933719" \
//   "0x1fb3d57cb168bd94838366debec418a05e295d8056e5a413d9d866c145b65c31" \
//   "0x0bbe338f5803236793d59a8b3104137391ef14e3aee23dbe7221e58d03117dc6"
