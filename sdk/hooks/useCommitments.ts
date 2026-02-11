import { useCallback, useEffect, useState } from "react";
import { toError } from "./helpers";
import {
  usePrivacyProtocol,
  type UsePrivacyProtocolOptions,
} from "./usePrivacyProtocol";

export interface UseCommitmentsOptions extends UsePrivacyProtocolOptions {
  fromBlock?: number;
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export function useCommitments(options: UseCommitmentsOptions) {
  const {
    poolAddress,
    provider,
    signer,
    circuit,
    fromBlock = 0,
    enabled = true,
    refetchIntervalMs = 0,
  } = options;
  const { sdk } = usePrivacyProtocol({
    poolAddress,
    provider,
    signer,
    circuit,
  });
  const [commitments, setCommitments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!sdk) {
      throw new Error("PrivacyProtocolSDK is not initialized.");
    }

    setIsLoading(true);
    setError(null);
    try {
      const leaves = await sdk.getLeaves(fromBlock);
      setCommitments(leaves);
      return leaves;
    } catch (caughtError) {
      const nextError = toError(caughtError);
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [sdk, fromBlock]);

  useEffect(() => {
    if (!enabled || !sdk) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    void refetch();

    if (refetchIntervalMs > 0) {
      intervalId = setInterval(() => {
        void refetch();
      }, refetchIntervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, sdk, refetch, refetchIntervalMs]);

  return {
    commitments,
    isLoading,
    error,
    refetch,
    sdk,
  };
}
