import { Barretenberg, Fr } from "@aztec/bb.js";

let bbInstance: Barretenberg | undefined;

async function getBb(): Promise<Barretenberg> {
  if (!bbInstance) {
    bbInstance = await Barretenberg.new();
  }
  return bbInstance;
}

export interface CommitmentData {
  secret: Fr;
  nullifier: Fr;
  commitment: Fr;
}

/**
 * Generates a commitment for a given amount.
 */
export async function generateCommitment(
  amount: string | number | bigint,
): Promise<CommitmentData> {
  const bb = await getBb();
  const amountFr = new Fr(BigInt(amount));
  const nullifier = Fr.random();
  const secret = Fr.random();
  const commitment = await bb.poseidon2Hash([nullifier, secret, amountFr]);

  return {
    secret,
    nullifier,
    commitment,
  };
}

/**
 * Computes the nullifier hash.
 */
export async function computeNullifierHash(
  nullifier: Fr | string,
): Promise<Fr> {
  const bb = await getBb();
  const nullifierFr =
    typeof nullifier === "string" ? Fr.fromString(nullifier) : nullifier;
  return await bb.poseidon2Hash([nullifierFr]);
}

/**
 * Computes a new commitment.
 */
export async function computeCommitment(
  nullifier: Fr | string,
  secret: Fr | string,
  amount: string | number | bigint,
): Promise<Fr> {
  const bb = await getBb();
  const nullifierFr =
    typeof nullifier === "string" ? Fr.fromString(nullifier) : nullifier;
  const secretFr = typeof secret === "string" ? Fr.fromString(secret) : secret;
  const amountFr = new Fr(BigInt(amount));
  return await bb.poseidon2Hash([nullifierFr, secretFr, amountFr]);
}
