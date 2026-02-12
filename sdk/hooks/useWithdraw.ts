import { useCallback, useState } from "react";
import type { Signer } from "ethers";
import type { ExecutionCallOptions, ExecutionResult } from "../core";
import {
  buildPrivacyNote,
  resolveChainId,
  toAmountString,
  toError,
} from "./helpers";
import type { AmountLike, PrivacyNote } from "./types";
import {
  usePrivacyProtocol,
  type UsePrivacyProtocolOptions,
} from "./usePrivacyProtocol";

export interface WithdrawArgs {
  token: string;
  recipient: string;
  amount: AmountLike;
  amountInPool?: AmountLike;
  secret?: string;
  nullifier?: string;
  note?: PrivacyNote;
  leaves?: string[];
  fromBlock?: number;
  signer?: Signer;
  executionOptions?: ExecutionCallOptions;
}

export interface UseWithdrawOptions extends UsePrivacyProtocolOptions {
  onSuccess?: (result: ExecutionResult, newNote: PrivacyNote) => void;
  onError?: (error: Error) => void;
}

export function useWithdraw(options: UseWithdrawOptions) {
  const { poolAddress, onSuccess, onError, ...contextOptions } = options;
  const { sdk, signer } = usePrivacyProtocol({ poolAddress, ...contextOptions });
  const [data, setData] = useState<ExecutionResult | null>(null);
  const [nextNote, setNextNote] = useState<PrivacyNote | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdraw = useCallback(
    async (args: WithdrawArgs) => {
      if (!sdk) {
        throw new Error("PrivacyProtocolSDK is not initialized.");
      }

      const txSigner = args.signer ?? signer;
      if (!txSigner) {
        throw new Error(
          "No signer available. Pass a signer in hook options or call args.",
        );
      }

      const secret = args.secret ?? args.note?.secret;
      const nullifier = args.nullifier ?? args.note?.nullifier;
      const amountInPool = args.amountInPool ?? args.note?.amount;

      if (!secret || !nullifier) {
        throw new Error(
          "Missing secret or nullifier. Provide them directly or pass a note.",
        );
      }
      if (amountInPool === undefined) {
        throw new Error(
          "Missing amountInPool. Provide it directly or pass a note.",
        );
      }

      setIsPending(true);
      setError(null);
      try {
        const leaves = args.leaves ?? (await sdk.getLeaves(args.fromBlock ?? 0));

        const result = await sdk.withdraw(
          args.token,
          args.recipient,
          args.amount,
          secret,
          nullifier,
          amountInPool,
          leaves,
          txSigner,
          args.executionOptions,
        );

        const chainId = await resolveChainId(txSigner);
        const amountLeft =
          BigInt(toAmountString(amountInPool)) - BigInt(toAmountString(args.amount));
        const generatedNote = buildPrivacyNote({
          id: `${result.newCommitment}:${result.txHash}`,
          poolAddress,
          token: args.token,
          amount: amountLeft >= 0n ? amountLeft.toString() : "0",
          secret: result.newSecret,
          nullifier: result.newNullifier,
          commitment: result.newCommitment,
          txHash: result.txHash,
          chainId,
          metadata: {
            sourceNoteId: args.note?.id,
            recipient: args.recipient,
            type: "withdraw",
          },
        });

        setData(result);
        setNextNote(generatedNote);
        onSuccess?.(result, generatedNote);
        return result;
      } catch (caughtError) {
        const nextError = toError(caughtError);
        setError(nextError);
        onError?.(nextError);
        throw nextError;
      } finally {
        setIsPending(false);
      }
    },
    [sdk, signer, poolAddress, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setNextNote(null);
    setError(null);
    setIsPending(false);
  }, []);

  return {
    withdraw,
    data,
    nextNote,
    isPending,
    error,
    reset,
    sdk,
    signer,
    isReady: Boolean(sdk && signer),
  };
}
