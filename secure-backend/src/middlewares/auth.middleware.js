import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { isVoterVerifiedOnChain, isSubAdminActiveOnChain } from "../utils/blockchain.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // 1️⃣ Get token from header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. No token provided.",
      });
    }

    // 2️⃣ Verify token
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // 3️⃣ Find user from DB
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // 4️⃣ Attach user to request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const verifyApprovedVoter = async (req, res, next) => {
  try {
    if (req.user?.role === "voter") {
      const isVerified = await isVoterVerifiedOnChain(req.user.walletAddress);
      if (!isVerified) {
        return res.status(403).json({
          success: false,
          message: `Hey ${req.user.fullName}, you are not approved for voting yet. Please wait for Admin or Sub-Admin approval.`,
        });
      }
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during voter verification",
    });
  }
};

export const verifyApprovedSubadmin = async (req, res, next) => {
  try {
    if (req.user?.role === "subadmin") {
      const isActiveOnChain = await isSubAdminActiveOnChain(req.user.walletAddress);
      if (!isActiveOnChain) {
        return res.status(403).json({
          success: false,
          message: `Hey ${req.user.fullName}, your account is waiting for Admin approval.`,
        });
      }
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during sub-admin verification",
    });
  }
};
