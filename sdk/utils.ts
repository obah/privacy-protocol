import { Barretenberg, Fr } from "@aztec/bb.js";

let bbInstance: Barretenberg | undefined;

function toFr(value: Fr | string): Fr {
  if (typeof value !== "string") {
    return value;
  }

  if (value.startsWith("0x") || value.startsWith("0X")) {
    return new Fr(BigInt(value));
  }

  return Fr.fromString(value);
}

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
  const nullifierFr = toFr(nullifier);
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
  const nullifierFr = toFr(nullifier);
  const secretFr = toFr(secret);
  const amountFr = new Fr(BigInt(amount));
  return await bb.poseidon2Hash([nullifierFr, secretFr, amountFr]);
}

/**
 * Computes the action context hash from external call address and data hash.
 */
export async function computeActionContextHash(
  externalAddress: Fr | string,
  dataHash: Fr | string,
): Promise<Fr> {
  const bb = await getBb();
  const externalAddressFr = toFr(externalAddress);
  const dataHashFr = toFr(dataHash);
  return await bb.poseidon2Hash([externalAddressFr, dataHashFr]);
}

/**
 * Computes the new output commitment bound to action context.
 */
export async function computeContextBoundCommitment(
  newNullifier: Fr | string,
  secret: Fr | string,
  amountLeft: string | number | bigint,
  externalAddress: Fr | string,
  dataHash: Fr | string,
): Promise<Fr> {
  const bb = await getBb();
  const newNullifierFr = toFr(newNullifier);
  const secretFr = toFr(secret);
  const amountLeftFr = new Fr(BigInt(amountLeft));
  const actionContextHash = await computeActionContextHash(
    externalAddress,
    dataHash,
  );
  return await bb.poseidon2Hash([
    newNullifierFr,
    secretFr,
    amountLeftFr,
    actionContextHash,
  ]);
}
