import { Address } from "viem";

export const DEMO_CONTRACTS = {
  PrivacyProtocolPool:
    (process.env.NEXT_PUBLIC_PRIVACY_PROTOCOL_POOL_ADDRESS as Address) ??
    ("0xA0806cf43f5E9A2C42c8291676EE814b39A6413e" as Address),
  DemoDefi: "0xA8DCc58D83Cae0FfF1076832Ef7E5a5D9B96D9d7" as Address,
  ppUSD: "0xba2A1482708e56b21f8EC7842650381855645c9A" as Address,
  USDTpp: "0x9eB5C2080E98c44b15cfd5a822414380458A7634" as Address,
  DemoDao: "0x0B25AbD0136f6Ed5C220604Ec27026522515194f" as Address,
};

export const DEMO_DEFI_ABI = [
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amountIn", type: "uint256" }],
    name: "swap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const DEMO_DAO_ABI = [
  {
    inputs: [],
    name: "getProposalCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "s_proposals",
    outputs: [
      { name: "proposer", type: "address" },
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "executed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "s_proposalVotes",
    outputs: [
      { name: "forVotes", type: "uint256" },
      { name: "againstVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "voter", type: "address" },
    ],
    name: "hasVoted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
