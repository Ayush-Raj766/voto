import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const abi = JSON.parse(
  fs.readFileSync(
    new URL("../src/abi/Voting.json", import.meta.url),
    "utf-8"
  )
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi.abi,
  wallet
);

async function testSubadmin() {
  const dummyWallet = ethers.Wallet.createRandom().address;
  console.log("Testing with dummy subadmin wallet:", dummyWallet);

  try {
    // 1. Add SubAdmin
    console.log("1. Adding subadmin...");
    let tx = await contract.addSubAdmin(dummyWallet, "Test Sub", "test@sub.com");
    console.log("Tx sent, waiting for confirmation...");
    await tx.wait();
    console.log("Subadmin added successfully!");

    // 2. Enable SubAdmin
    console.log("2. Enabling subadmin...");
    tx = await contract.enableSubAdmin(dummyWallet);
    console.log("Tx sent, waiting for confirmation...");
    await tx.wait();
    console.log("Subadmin enabled successfully!");

    // 3. Disable SubAdmin
    console.log("3. Disabling subadmin...");
    tx = await contract.disableSubAdmin(dummyWallet);
    console.log("Tx sent, waiting for confirmation...");
    await tx.wait();
    console.log("Subadmin disabled successfully!");

    // 4. Delete SubAdmin
    console.log("4. Deleting subadmin...");
    tx = await contract.deleteSubAdmin(dummyWallet);
    console.log("Tx sent, waiting for confirmation...");
    await tx.wait();
    console.log("Subadmin deleted successfully!");

    console.log("All blockchain subadmin operations are working perfectly on-chain!");
  } catch (err) {
    console.error("Operation failed:", err);
  }
}

testSubadmin();
