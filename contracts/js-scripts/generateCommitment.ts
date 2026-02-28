import { poseidon2Hash } from "@aztec/foundation/crypto";
import { Fr } from "@aztec/foundation/fields";
import { ethers } from "ethers";

(async () => {
  try {
    const amountInput = process.argv[2] ? process.argv[2] : "0";
    const amount = new Fr(BigInt(amountInput));
    const nullifier = Fr.random();
    const secret = Fr.random();
    const commitment: Fr = await poseidon2Hash([nullifier, secret, amount]);

    const result = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes32", "bytes32", "bytes32"],
      [
        commitment.toBuffer(),
        nullifier.toBuffer(),
        secret.toBuffer(),
        amount.toBuffer(),
      ],
    );

    process.stdout.write(result);
    process.exit(0);
  } catch (error) {
    console.error("DEBUG: Script failed during execution.", error);
    process.exit(1);
  }
})();
