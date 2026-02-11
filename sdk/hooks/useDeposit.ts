import { useCallback, useState } from "react";
import type { Signer } from "ethers";
import type { DepositResult } from "../core";
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

export interface DepositArgs {
  token: string;
  amount: AmountLike;
  signer?: Signer;
  metadata?: Record<string, unknown>;
}

export interface UseDepositOptions extends UsePrivacyProtocolOptions {
  onSuccess?: (result: DepositResult, note: PrivacyNote) => void;
  onError?: (error: Error) => void;
}

export function useDeposit(options: UseDepositOptions) {
  const { poolAddress, onSuccess, onError, ...contextOptions } = options;
  const { sdk, signer } = usePrivacyProtocol({ poolAddress, ...contextOptions });
  const [data, setData] = useState<DepositResult | null>(null);
  const [note, setNote] = useState<PrivacyNote | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deposit = useCallback(
    async (args: DepositArgs) => {
      if (!sdk) {
        throw new Error("PrivacyProtocolSDK is not initialized.");
      }

      const txSigner = args.signer ?? signer;
      if (!txSigner) {
        throw new Error(
          "No signer available. Pass a signer in hook options or call args.",
        );
      }

      setIsPending(true);
      setError(null);
      try {
        const result = await sdk.deposit(args.token, args.amount, txSigner);
        const chainId = await resolveChainId(txSigner);
        const createdNote = buildPrivacyNote({
          id: `${result.commitment}:${result.txHash}`,
          poolAddress,
          token: args.token,
          amount: toAmountString(args.amount),
          secret: result.secret,
          nullifier: result.nullifier,
          commitment: result.commitment,
          txHash: result.txHash,
          chainId,
          metadata: args.metadata,
        });

        setData(result);
        setNote(createdNote);
        onSuccess?.(result, createdNote);
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
    setNote(null);
    setError(null);
    setIsPending(false);
  }, []);

  return {
    deposit,
    data,
    note,
    isPending,
    error,
    reset,
    sdk,
    signer,
    isReady: Boolean(sdk && signer),
  };
}
