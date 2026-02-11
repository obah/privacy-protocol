import type { Barretenberg, Fr } from "@aztec/bb.js";
import { loadBb } from "./bb";

let bbInstance: Barretenberg | undefined;
let frClass: typeof Fr | undefined;

async function getFrClass(): Promise<typeof Fr> {
  if (!frClass) {
    const bbModule = await loadBb();
    frClass = bbModule.Fr;
  }

  return frClass;
}

async function toFr(value: Fr | string): Promise<Fr> {
  if (typeof value !== "string") {
    return value;
  }

  const FrCtor = await getFrClass();

  if (value.startsWith("0x") || value.startsWith("0X")) {
    return new FrCtor(BigInt(value));
  }

  return FrCtor.fromString(value);
}

async function getBb(): Promise<Barretenberg> {
  if (!bbInstance) {
    const bbModule = await loadBb();
    const BarretenbergCtor = bbModule.Barretenberg;

    bbInstance = await BarretenbergCtor.new();
  }

  return bbInstance;
}

/**
 * Generates a commitment for a given amount.
 */
export async function generateCommitment(
  amount: string | number | bigint,
): Promise<CommitmentData> {
  const bb = await getBb();
  const FrCtor = await getFrClass();
  const amountFr = new FrCtor(BigInt(amount));
  const nullifier = FrCtor.random();
  const secret = FrCtor.random();
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
  const nullifierFr = await toFr(nullifier);
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
  const FrCtor = await getFrClass();
  const nullifierFr = await toFr(nullifier);
  const secretFr = await toFr(secret);
  const amountFr = new FrCtor(BigInt(amount));
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
  const externalAddressFr = await toFr(externalAddress);
  const dataHashFr = await toFr(dataHash);
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
  const FrCtor = await getFrClass();
  const newNullifierFr = await toFr(newNullifier);
  const secretFr = await toFr(secret);
  const amountLeftFr = new FrCtor(BigInt(amountLeft));
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
export interface CommitmentData {
  secret: Fr;
  nullifier: Fr;
  commitment: Fr;
}
