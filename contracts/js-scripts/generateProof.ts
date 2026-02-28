import { UltraHonkBackend } from "@aztec/bb.js";
import { poseidon2Hash } from "@aztec/foundation/crypto";
import { Fr } from "@aztec/foundation/fields";
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
  const inputs = process.argv.slice(2);

  const nullifier = inputs[0];
  const secret = inputs[1];
  const amountInPool = inputs[2];
  const amountToWithdraw = inputs[3];
  const recipient = inputs[4];
  const dataHash = inputs[5]; // 248-bit truncated keccak256(actionId || calldata) for executeAction
  const leaves = inputs.slice(6);

  const amountLeft = BigInt(amountInPool) - BigInt(amountToWithdraw);

  const commitment = await poseidon2Hash([
    Fr.fromString(nullifier),
    Fr.fromString(secret),
    new Fr(BigInt(amountInPool)),
  ]);

  const nullifierHash = await poseidon2Hash([Fr.fromString(nullifier)]);

  const newNullifier = Fr.random();
  const actionContextHash = await poseidon2Hash([
    new Fr(BigInt(recipient)),
    new Fr(BigInt(dataHash)),
  ]);
  const newCommitment = await poseidon2Hash([
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

    const originalLog = console.log;
    let proof: Uint8Array;
    let publicInputs: string[];
    try {
      console.log = () => {};
      ({ proof, publicInputs } = await honk.generateProof(witness, {
        keccakZK: true,
      }));
    } finally {
      console.log = originalLog;
    }

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
