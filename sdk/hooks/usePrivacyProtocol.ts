import { useMemo } from "react";
import type { Provider, Signer } from "ethers";
import {
  PrivacyProtocolSDK,
  type RelayerTransportConfig,
} from "../core";

export interface UsePrivacyProtocolOptions {
  poolAddress: string;
  provider: Provider | null;
  signer?: Signer | null;
  circuit?: any;
  relayer?: RelayerTransportConfig;
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
  const { poolAddress, provider, signer, circuit, relayer } = options;

  const sdk = useMemo(() => {
    if (!provider || !poolAddress) {
      return null;
    }

    return new PrivacyProtocolSDK(provider, poolAddress, circuit, {
      relayer,
    });
  }, [provider, poolAddress, circuit, relayer]);

  return {
    sdk,
    provider,
    signer: signer ?? null,
    isReady: Boolean(sdk && signer),
  };
}
