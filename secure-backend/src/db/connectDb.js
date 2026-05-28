import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const connectDB = async () => {
    try {
        const instance = await mongoose.connect(`${process.env.MONGO_DB_URI}/voting_system`) 
        console.log(`Database Connected ${instance.connection.host}`);

        // Seed static admin from environment variables
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const adminWallet = process.env.ADMIN_WALLET?.toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (adminEmail && adminWallet && adminPassword) {
            const existingAdmin = await User.findOne({ email: adminEmail });
            let adminId;
            if (!existingAdmin) {
                console.log("Seeding static admin...");
                const admin = await User.create({
                    fullName: "System Admin",
                    email: adminEmail,
                    aadhaarId: "0000-0000-0000",
                    role: "admin",
                    walletAddress: adminWallet,
                    organizationName: "global",
                    isApproved: true,
                    approvalStatus: "approved",
                    isActive: true,
                    password: adminPassword
                });
                adminId = admin._id;
                console.log("Static admin seeded successfully.");
            } else {
                adminId = existingAdmin._id;
                // Check if wallet or password changed before saving
                const isPasswordCorrect = await existingAdmin.isPasswordCorrect(adminPassword);
                if (existingAdmin.walletAddress !== adminWallet || !isPasswordCorrect) {
                    existingAdmin.walletAddress = adminWallet;
                    existingAdmin.password = adminPassword;
                    await existingAdmin.save();
                    console.log("Static admin credentials updated to match environment variables.");
                } else {
                    console.log("Static admin checked and synchronized with env.");
                }
            }

            // Seed default "global" organization if it doesn't exist
            const { Organization } = await import("../models/organization.model.js");
            const existingOrg = await Organization.findOne({ name: "global" });
            if (!existingOrg) {
                console.log("Seeding global organization...");
                await Organization.create({
                    name: "global",
                    createdBy: adminId
                });
                console.log("Global organization seeded successfully.");
            }
        }
    
    } catch (error) {
        console.log("Mongo DB Connection error", error);
        process.exit(1);
    }
}

export default connectDB