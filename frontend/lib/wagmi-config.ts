import { createConfig, http } from "wagmi";
import { mainnet, sepolia, arbitrumSepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

const WALLET_ID = process.env.NEXT_PUBLIC_WALLET_ID;
const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID;

// export const wagmi_config = createConfig({
//   connectors: [familyAccountsConnector()],
//   chains: [mainnet, sepolia, arbitrumSepolia],
//   transports: {
//     [mainnet.id]: http(),
//     [sepolia.id]: http(),
//     [arbitrumSepolia.id]: http(),
//   },

//   //   walletConnectProjectId: WALLET_ID
// });

export const wagmi_config = createConfig(
  getDefaultConfig({
    chains: [arbitrumSepolia],
    transports: {
      // [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`),
      // [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`),
      [arbitrumSepolia.id]: http(
        `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`,
      ),
    },
    walletConnectProjectId: WALLET_ID ?? "",
    appName: "Privacy Protocol",
    appDescription: "Private Middleware for dApps",
    // appUrl: "https://family.co",
    // appIcon: "https://family.co/logo.png",
  }),
);
