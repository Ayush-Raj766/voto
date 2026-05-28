import { contract } from "../utils/blockchain.js";
import { User } from "../models/user.model.js";

export const startSyncService = () => {
  console.log("Initializing Blockchain Sync Service...");

  try {
    // Event: SubAdminAdded(address wallet, string name)
    contract.on("SubAdminAdded", async (wallet, name) => {
      try {
        console.log(`[Event: SubAdminAdded] Wallet: ${wallet}, Name: ${name}`);
        const lowercaseWallet = wallet.toLowerCase();
        
        await User.findOneAndUpdate(
          { walletAddress: lowercaseWallet, role: "subadmin" },
          {
            isApproved: false,
            approvalStatus: "pending",
            isActive: false
          }
        );
      } catch (error) {
        console.error("Error syncing SubAdminAdded event:", error);
      }
    });

    // Event: SubAdminRemoved(address wallet)
    contract.on("SubAdminRemoved", async (wallet) => {
      try {
        console.log(`[Event: SubAdminRemoved] Wallet: ${wallet}`);
        const lowercaseWallet = wallet.toLowerCase();
        await User.findOneAndDelete({ walletAddress: lowercaseWallet, role: "subadmin" });
      } catch (error) {
        console.error("Error syncing SubAdminRemoved event:", error);
      }
    });

    // Event: VoterVerified(address voter)
    contract.on("VoterVerified", async (voterWallet) => {
      try {
        console.log(`[Event: VoterVerified] Wallet: ${voterWallet}`);
        const lowercaseWallet = voterWallet.toLowerCase();
        await User.findOneAndUpdate(
          { walletAddress: lowercaseWallet, role: "voter" },
          {
            isApproved: true,
            approvalStatus: "approved"
          }
        );
      } catch (error) {
        console.error("Error syncing VoterVerified event:", error);
      }
    });

    console.log("Blockchain Sync Service successfully initialized and listening to events.");
  } catch (error) {
    console.error("Failed to start Blockchain Sync Service:", error);
  }
};
