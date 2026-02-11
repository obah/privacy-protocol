import { useMemo } from "react";
import { BrowserProvider, JsonRpcProvider, JsonRpcSigner } from "ethers";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

type Eip1193ProviderLike = {
  request: (args: {
    method: string;
    params?: readonly unknown[] | object;
  }) => Promise<unknown>;
};

export function useEthersFromWagmi() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const readProvider = useMemo(() => {
    if (!publicClient) {
      return null;
    }

    const transport = publicClient.transport as { url?: string };
    const rpcUrl = transport.url ?? publicClient.chain?.rpcUrls.default.http[0];

    if (!rpcUrl) {
      return null;
    }

    return new JsonRpcProvider(
      rpcUrl,
      publicClient.chain
        ? {
            chainId: publicClient.chain.id,
            name: publicClient.chain.name,
          }
        : undefined,
    );
  }, [publicClient]);

  const walletProvider = useMemo(() => {
    if (!walletClient) {
      return null;
    }

    try {
      return new BrowserProvider(
        walletClient.transport as unknown as Eip1193ProviderLike,
        walletClient.chain
          ? {
              chainId: walletClient.chain.id,
              name: walletClient.chain.name,
            }
          : undefined,
      );
    } catch {
      return null;
    }
  }, [walletClient]);

  const signer = useMemo(() => {
    if (!walletProvider || !address) {
      return null;
    }

    return new JsonRpcSigner(walletProvider, address);
  }, [walletProvider, address]);

  return {
    provider: walletProvider ?? readProvider,
    signer,
    address,
  };
}
