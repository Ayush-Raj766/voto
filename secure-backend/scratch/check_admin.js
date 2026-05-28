import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("RPC URL:", process.env.SEPOLIA_RPC_URL);
console.log("Contract Address:", process.env.CONTRACT_ADDRESS);

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("Wallet address from PRIVATE_KEY:", wallet.address);

const abi = JSON.parse(
  fs.readFileSync(
    new URL("../src/abi/Voting.json", import.meta.url),
    "utf-8"
  )
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi.abi,
  provider
);

async function check() {
  try {
    const adminAddress = await contract.admin();
    console.log("Admin address on Contract:", adminAddress);
    console.log("Do they match?", adminAddress.toLowerCase() === wallet.address.toLowerCase());
    
    // Check balance of wallet
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet Balance:", ethers.formatEther(balance), "ETH");
  } catch (err) {
    console.error("Error checking contract:", err);
  }
}

check();
