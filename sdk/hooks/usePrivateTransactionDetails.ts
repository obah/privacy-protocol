import { useCallback, useEffect, useState } from "react";
import type { PrivateTransactionDetails } from "../core";
import { toError } from "./helpers";
import {
  usePrivacyProtocol,
  type UsePrivacyProtocolOptions,
} from "./usePrivacyProtocol";

export interface UsePrivateTransactionDetailsOptions
  extends UsePrivacyProtocolOptions {
  txHash?: string;
  enabled?: boolean;
}

export function usePrivateTransactionDetails(
  options: UsePrivateTransactionDetailsOptions,
) {
  const { txHash, enabled = true, ...contextOptions } = options;
  const { sdk } = usePrivacyProtocol(contextOptions);
  const [data, setData] = useState<PrivateTransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!sdk) {
      throw new Error("PrivacyProtocolSDK is not initialized.");
    }
    if (!txHash) {
      throw new Error("txHash is required to fetch transaction details.");
    }

    setIsLoading(true);
    setError(null);
    try {
      const details = await sdk.getPrivateTransactionDetails(txHash);
      setData(details);
      return details;
    } catch (caughtError) {
      const nextError = toError(caughtError);
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [sdk, txHash]);

  useEffect(() => {
    if (!enabled || !txHash || !sdk) {
      return;
    }

    void refetch();
  }, [enabled, txHash, sdk, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    sdk,
  };
}
