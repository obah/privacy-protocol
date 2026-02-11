import { useMemo } from "react";
import type { Provider, Signer } from "ethers";
import { PrivacyProtocolSDK } from "../core";

export interface UsePrivacyProtocolOptions {
  poolAddress: string;
  provider: Provider | null;
  signer?: Signer | null;
  circuit?: any;
}

export interface PrivacyProtocolContext {
  sdk: PrivacyProtocolSDK | null;
  provider: Provider | null;
  signer: Signer | null;
  isReady: boolean;
}

export function usePrivacyProtocol(
  options: UsePrivacyProtocolOptions,
): PrivacyProtocolContext {
  const { poolAddress, provider, signer, circuit } = options;

  const sdk = useMemo(() => {
    if (!provider || !poolAddress) {
      return null;
    }

    return new PrivacyProtocolSDK(provider, poolAddress, circuit);
  }, [provider, poolAddress, circuit]);

  return {
    sdk,
    provider,
    signer: signer ?? null,
    isReady: Boolean(sdk && signer),
  };
}
