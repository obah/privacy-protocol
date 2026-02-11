import type { Signer } from "ethers";
import type { AmountLike, PrivacyNote } from "./types";

export interface BuildPrivacyNoteArgs {
  poolAddress: string;
  token: string;
  amount: AmountLike;
  secret: string;
  nullifier: string;
  commitment: string;
  txHash: string;
  chainId?: number;
  id?: string;
  metadata?: Record<string, unknown>;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function toAmountString(amount: AmountLike): string {
  if (typeof amount === "bigint") {
    return amount.toString();
  }
  return String(amount);
}

export async function resolveChainId(
  signer: Signer | null | undefined,
): Promise<number | undefined> {
  if (!signer?.provider) {
    return undefined;
  }

  const network = await signer.provider.getNetwork();
  return Number(network.chainId);
}

export function buildPrivacyNote(args: BuildPrivacyNoteArgs): PrivacyNote {
  return {
    id: args.id ?? args.commitment,
    poolAddress: args.poolAddress,
    token: args.token,
    amount: toAmountString(args.amount),
    secret: args.secret,
    nullifier: args.nullifier,
    commitment: args.commitment,
    txHash: args.txHash,
    chainId: args.chainId,
    createdAt: Date.now(),
    metadata: args.metadata,
  };
}
