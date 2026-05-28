import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";

dotenv.config();

/* Validate environment variables */
if (!process.env.SEPOLIA_RPC_URL) {
  throw new Error("Missing SEPOLIA_RPC_URL in environment variables");
}

if (!process.env.PRIVATE_KEY) {
  throw new Error("Missing PRIVATE_KEY in environment variables");
}

if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("Missing CONTRACT_ADDRESS in environment variables");
}

/* Load ABI */
const abi = JSON.parse(
  fs.readFileSync(
    new URL("../abi/Voting.json", import.meta.url),
    "utf-8"
  )
);

/* Provider */
const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL
);

/* Admin wallet */
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

/* Contract instance */
export const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi.abi,
  wallet
);

export const isVoterVerifiedOnChain = async (walletAddress) => {
  try {
    if (!walletAddress) return false;
    const voter = await contract.voters(walletAddress.toLowerCase());
    return voter.verified;
  } catch (error) {
    console.error("Error checking voter verification on chain:", error);
    return false;
  }
};

export const isSubAdminActiveOnChain = async (walletAddress) => {
  try {
    if (!walletAddress) return false;
    const subAdmin = await contract.subAdmins(walletAddress.toLowerCase());
    return subAdmin.isActive;
  } catch (error) {
    console.error("Error checking subadmin active status on chain:", error);
    return false;
  }
};