import { ethers } from "ethers";
import PrivacyProtocolSDK from "../index";
import circuit from "../circuits.json";

const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil default private key #0
const RPC_URL = "http://127.0.0.1:8545";

const PRIVACY_PROTOCOL_POOL_ADDRESS =
  process.env.PRIVACY_PROTOCOL_POOL_ADDRESS || "";
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";
const DEMO_DEFI_ADDRESS = process.env.DEMO_DEFI_ADDRESS || "";

async function main() {
  if (!PRIVACY_PROTOCOL_POOL_ADDRESS || !TOKEN_ADDRESS) {
    console.error(
      "Please provide PRIVACY_PROTOCOL_POOL_ADDRESS and TOKEN_ADDRESS environment variables.",
    );
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`Connected with wallet: ${wallet.address}`);

  const sdk = new PrivacyProtocolSDK(
    provider,
    PRIVACY_PROTOCOL_POOL_ADDRESS,
    circuit,
  );

  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, uint256 amount) external",
  ];
  const tokenContract = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);
  const demoDefiAbi = ["function faucet() external"];
  const demoDefi = DEMO_DEFI_ADDRESS
    ? new ethers.Contract(DEMO_DEFI_ADDRESS, demoDefiAbi, wallet)
    : undefined;

  console.log("\n--- Starting Deposit ---");
  const depositAmount = ethers.parseEther("100.0");

  let balance = await tokenContract.balanceOf(wallet.address);
  console.log(`Initial Token Balance: ${ethers.formatEther(balance)}`);

  if (balance < depositAmount && demoDefi) {
    console.log("Requesting demo faucet...");
    await (await demoDefi.faucet()).wait();
    balance = await tokenContract.balanceOf(wallet.address);
    console.log(`Token Balance after faucet: ${ethers.formatEther(balance)}`);
  }

  if (balance < depositAmount) {
    console.log("Minting test tokens...");
    await (await tokenContract.mint(wallet.address, depositAmount)).wait();
    balance = await tokenContract.balanceOf(wallet.address);
    console.log(`Token Balance after mint: ${ethers.formatEther(balance)}`);
  }

  console.log("Approving token...");
  await (
    await tokenContract.approve(PRIVACY_PROTOCOL_POOL_ADDRESS, depositAmount)
  ).wait();

  console.log("Depositing...");
  const { secret, nullifier, commitment, txHash } = await sdk.deposit(
    TOKEN_ADDRESS,
    depositAmount,
    wallet,
  );
  console.log(`Deposit successful! Tx: ${txHash}`);
  console.log(`Amount deposited: ${ethers.formatEther(depositAmount)}`);
  balance = await tokenContract.balanceOf(wallet.address);
  console.log(`New balance: ${ethers.formatEther(balance)}`);
  console.log(`Secret: ${secret}`);
  console.log(`Nullifier: ${nullifier}`);

  console.log("\n--- Starting Withdrawal ---");

  console.log("Syncing Merkle Tree...");
  const leaves = await sdk.getLeaves();
  console.log(`Found ${leaves.length} leaves.`);

  console.log("Withdrawing...");
  try {
    const withdrawRes = await sdk.withdraw(
      TOKEN_ADDRESS,
      wallet.address,
      depositAmount,
      secret,
      nullifier,
      depositAmount,
      leaves,
      wallet,
    );
    console.log(`Withdrawal successful! Tx: ${withdrawRes.txHash}`);
    console.log(`Amount withdrawn: ${ethers.formatEther(depositAmount)}`);
    balance = await tokenContract.balanceOf(wallet.address);
    console.log(`New balance: ${ethers.formatEther(balance)}`);
    console.log(`New Secret: ${withdrawRes.newSecret}`);
    console.log(`New Nullifier: ${withdrawRes.newNullifier}`);
  } catch (error) {
    console.error("Withdrawal failed:", error);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
