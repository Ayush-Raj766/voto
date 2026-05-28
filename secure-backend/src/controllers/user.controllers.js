import { User } from "../models/user.model.js"
import { contract, isVoterVerifiedOnChain, isSubAdminActiveOnChain } from "../utils/blockchain.js"
import { ethers } from "ethers"



/* =====================================================
   CONSTANTS
===================================================== */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_WALLET = process.env.ADMIN_WALLET?.toLowerCase();

/* =====================================================
   LOGIN USER
===================================================== */
export const loginUser = async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address",
      });
    }

    const wallet = walletAddress.toLowerCase();

    /* ================= ADMIN LOGIN ================= */
    if (email === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }

      if (wallet !== ADMIN_WALLET) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin wallet",
        });
      }

      let admin = await User.findOne({ email: ADMIN_EMAIL });

      if (!admin) {
        admin = await User.create({
          fullName: "System Admin",
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: "admin",
          walletAddress: ADMIN_WALLET,
          isApproved: true,
          approvalStatus: "approved",
        });
      }

      const accessToken = admin.generateAccessToken();
      const refreshToken = admin.generateRefreshToken();

      admin.refreshToken = refreshToken;
      await admin.save({ validateBeforeSave: false });

      const adminData = admin.toObject();
      delete adminData.password;
      delete adminData.refreshToken;

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        data: {
          user: { ...adminData, onChainApproved: true },
          accessToken,
        },
      });
    }

    /* ================= NORMAL USER ================= */
    const user = await User.findOne({
      email: email.toLowerCase(),
      walletAddress: wallet,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or wallet mismatch",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account deactivated",
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let onChainApproved = false;

if (user.role === "voter") {
  onChainApproved = await isVoterVerifiedOnChain(wallet);
}

if (user.role === "subadmin") {
  onChainApproved = await isSubAdminActiveOnChain(wallet);
}

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: { ...userData, onChainApproved },
        accessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* =====================================================
   REGISTER USER
===================================================== */

export const registerUser = async (req, res) => {
  try {

    const {
      fullName,
      email,
      aadhaarId,
      role,
      password,
      walletAddress,
      organizationName   // ✅ NEW FIELD
    } = req.body

    console.log("hie",organizationName);
    

    // ✅ VALIDATION
    if (!fullName || !email || !aadhaarId || !role || !password || !walletAddress || !organizationName) {
      return res.status(400).json({
        success: false,
        message: "All fields including organization name are required"
      })
    }

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be registered dynamically"
      })
    }
    console.log("ether");
    
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address"
      })
    }
    console.log("ethwr 2");
    

    const wallet = walletAddress.toLowerCase()

    // ✅ Normalize organization
    const org = organizationName.toLowerCase().trim()

    // 🔍 CHECK DUPLICATES
    const emailExists = await User.findOne({ email })
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      })
    }

    const aadhaarExists = await User.findOne({ aadhaarId })
    if (aadhaarExists) {
      return res.status(409).json({
        success: false,
        message: "Aadhaar already registered"
      })
    }

    const walletExists = await User.findOne({ walletAddress: wallet })
    if (walletExists) {
      return res.status(409).json({
        success: false,
        message: "Wallet address already registered"
      })
    }

    // ✅ APPROVAL LOGIC
    const isApproved = role === "admin"
    const approvalStatus = role === "admin" ? "approved" : "pending"

    // ✅ CREATE USER WITH ORGANIZATION
    const user = await User.create({
      fullName,
      email,
      aadhaarId,
      role,
      password,
      walletAddress: wallet,
      organizationName: org,   // 🔥 SAVE HERE
      isApproved,
      approvalStatus
    })

    // 🔐 TOKENS
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    const userData = user.toObject()
    delete userData.password
    delete userData.refreshToken

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userData,
        accessToken
      }
    })

  } catch (error) {
    console.log(error.message);
    
    return res.status(500).json({
      success: false,
      message: error.message
    })

  }
}





/* =====================================================
   GET CURRENT USER
===================================================== */

export const getCurrentUser = async (req, res) => {

  try {

    const user = req.user.toObject()

    delete user.password
    delete user.refreshToken

    // Query on-chain status dynamically
    if (user.role === "voter") {
      user.isVerifiedOnChain = await isVoterVerifiedOnChain(user.walletAddress);
      if (user.isVerifiedOnChain !== user.isApproved) {
        await User.findByIdAndUpdate(user._id, {
          isApproved: user.isVerifiedOnChain,
          approvalStatus: user.isVerifiedOnChain ? "approved" : user.approvalStatus
        });
        user.isApproved = user.isVerifiedOnChain;
        if (user.isVerifiedOnChain) {
          user.approvalStatus = "approved";
        }
      }
    } else if (user.role === "subadmin") {
      user.isActiveOnChain = await isSubAdminActiveOnChain(user.walletAddress);
      if (user.isActiveOnChain !== user.isActive) {
        await User.findByIdAndUpdate(user._id, {
          isActive: user.isActiveOnChain,
          isApproved: user.isActiveOnChain,
          approvalStatus: user.isActiveOnChain ? "approved" : user.approvalStatus
        });
        user.isActive = user.isActiveOnChain;
        if (user.isActiveOnChain) {
          user.isApproved = true;
          user.approvalStatus = "approved";
        }
      }
    }

    return res.status(200).json({
      success: true,
      user
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    })

  }

}



/* =====================================================
   APPROVE / REJECT VOTER
   (Blockchain integration fixed here)
===================================================== */

export const approveVoter = async (req, res) => {
  try {

    const { approved } = req.body

    if (req.user.role !== "admin" && req.user.role !== "subadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Admin or Sub-Admin can approve/reject voters"
      });
    }

    const user = await User.findById(req.params.id)

    if (!user || user.role !== "voter") {
      return res.status(404).json({
        success: false,
        message: "Voter not found"
      })
    }

    if (req.user.role === "subadmin" && user.organizationName !== req.user.organizationName) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only manage voters within your organization"
      });
    }

    /* ---------- Update DB status ---------- */

    user.isApproved = approved
    user.approvalStatus = approved ? "approved" : "rejected"
    await user.save()


    /* ---------- Blockchain Integration ---------- */

    if (approved) {

      try {

        const wallet = user.walletAddress.toLowerCase()

        /* Check voter status on blockchain */

        const voter = await contract.voters(wallet)

        /* Register voter if not registered */

        if (!voter.registered) {

          const registerTx = await contract.registerVoter(user.fullName)

          console.log("Register voter tx:", registerTx.hash)

          await registerTx.wait()

        }

        /* Verify voter */

        if (!voter.verified) {

          const verifyTx = await contract.verifyVoter(wallet)

          console.log("Verify voter tx:", verifyTx.hash)

          await verifyTx.wait()

        }

      } catch (error) {

        console.log("Blockchain voter verification error:", error)

      }

    }


    return res.status(200).json({
      success: true,
      message: approved
        ? "Voter approved successfully"
        : "Voter rejected"
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }
}

/* =====================================================
   APPROVE / REJECT SUB-ADMIN
===================================================== */
export const approveSubadmin = async (req, res) => {
  try {
    const { approved } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Admin can approve/reject Sub-Admins"
      });
    }

    const subadmin = await User.findById(req.params.id);

    if (!subadmin || subadmin.role !== "subadmin") {
      return res.status(404).json({
        success: false,
        message: "Sub-Admin not found"
      });
    }

    subadmin.isApproved = approved;
    subadmin.approvalStatus = approved ? "approved" : "rejected";
    subadmin.isActive = approved;

    await subadmin.save({ validateBeforeSave: false });

    /* ---------- Blockchain synchronization ---------- */
    try {
      const wallet = subadmin.walletAddress.toLowerCase();
      if (approved) {
        const tx = await contract.enableSubAdmin(wallet);
        await tx.wait();
      } else {
        const tx = await contract.disableSubAdmin(wallet);
        await tx.wait();
      }
    } catch (error) {
      console.log("Blockchain toggle subadmin on approval error:", error);
    }

    return res.status(200).json({
      success: true,
      message: approved ? "Sub-Admin approved successfully" : "Sub-Admin rejected successfully",
      data: subadmin
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/* =====================================================
   GET ALL VOTERS
===================================================== */

export const getVoters = async (req, res) => {

  try {
    const query = { role: "voter" };

    if (req.user.role !== "admin") {
      const organizationName = req.user.organizationName;
      if (!organizationName) {
        return res.status(400).json({
          success: false,
          message: "Organization not found for user"
        });
      }
      query.organizationName = organizationName;
    }

    const voters = await User
      .find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })

    // Populate blockchain verification status
    const votersWithBlockchain = await Promise.all(
      voters.map(async (v) => {
        const doc = v.toObject();
        try {
          doc.isVerifiedOnChain = await isVoterVerifiedOnChain(v.walletAddress);
        } catch {
          doc.isVerifiedOnChain = false;
        }
        return doc;
      })
    );

    return res.status(200).json({
      success: true,
      voters: votersWithBlockchain
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}




/* =====================================================
   CREATE SUBADMIN
===================================================== */

export const createSubadmin = async (req, res) => {

  try {

    const {
      fullName,
      email,
      walletAddress,
      aadhaarId,
      password,
      organizationName   // ✅ NEW
    } = req.body

    // ✅ VALIDATION
    if (!fullName || !email || !walletAddress || !aadhaarId || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: "All fields including organization name are required"
      })
    }

    const wallet = walletAddress.toLowerCase()
    const org = organizationName.toLowerCase().trim()

    // 🔍 CHECK DUPLICATES
    const existing = await User.findOne({
      $or: [
        { email },
        { aadhaarId },
        { walletAddress: wallet }
      ]
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      })
    }

    // ✅ CREATE SUBADMIN WITH ORG
    const subadmin = await User.create({
      fullName,
      email,
      walletAddress: wallet,
      aadhaarId,
      password,
      role: "subadmin",
      organizationName: org,   // 🔥 IMPORTANT
      isApproved: false,
      approvalStatus: "pending",
      isActive: false
    })

    /* ---------- Blockchain ---------- */
    try {
      const tx = await contract.addSubAdmin(
        wallet,
        fullName,
        email
      )
      await tx.wait()
    } catch (error) {
      console.log("Blockchain subadmin error:", error)
    }

    const userData = subadmin.toObject()
    delete userData.password
    delete userData.refreshToken

    return res.status(201).json({
      success: true,
      message: "SubAdmin created successfully",
      data: userData
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


/* =====================================================
   GET SUBADMINS
===================================================== */

export const getSubadmins = async (req, res) => {

  try {

    const subadmins = await User
      .find({ role: "subadmin" })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })

    // Populate blockchain active status
    const subadminsWithBlockchain = await Promise.all(
      subadmins.map(async (sub) => {
        const doc = sub.toObject();
        try {
          doc.isActiveOnChain = await isSubAdminActiveOnChain(sub.walletAddress);
        } catch {
          doc.isActiveOnChain = false;
        }
        return doc;
      })
    );

    return res.status(200).json({
      success: true,
      subadmins: subadminsWithBlockchain
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



/* =====================================================
   LOGOUT USER
===================================================== */

export const logoutUser = async (req, res) => {

  try {

    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    )

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



/* =====================================================
   TOGGLE SUBADMIN ACTIVE STATUS
===================================================== */

export const toggleSubadminActive = async (req, res) => {

  try {

    const user = await User.findById(req.params.id)

    if (!user || user.role !== "subadmin") {

      return res.status(404).json({
        success: false,
        message: "Subadmin not found"
      })

    }

    if (user.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved sub-admins can be enabled/disabled"
      })
    }

    const newStatus = !user.isActive

    /* ---------- Blockchain Integration ---------- */
    try {
      const wallet = user.walletAddress.toLowerCase()
      if (newStatus) {
        const tx = await contract.enableSubAdmin(wallet)
        await tx.wait()
      } else {
        const tx = await contract.disableSubAdmin(wallet)
        await tx.wait()
      }
    } catch (error) {
      console.log("Blockchain toggle subadmin error:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to update subadmin status on blockchain"
      })
    }

    user.isActive = newStatus

    await user.save({ validateBeforeSave: false })

    return res.status(200).json({
      success: true,
      message: user.isActive
        ? "Subadmin enabled"
        : "Subadmin disabled",
      isActive: user.isActive
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



/* =====================================================
   DELETE SUBADMIN
===================================================== */

export const deleteSubadmin = async (req, res) => {

  try {

    const user = await User.findById(req.params.id)

    if (!user || user.role !== "subadmin") {

      return res.status(404).json({
        success: false,
        message: "Subadmin not found"
      })

    }

    /* ---------- Blockchain Integration ---------- */
    try {
      const wallet = user.walletAddress.toLowerCase()
      const tx = await contract.deleteSubAdmin(wallet)
      await tx.wait()
    } catch (error) {
      console.log("Blockchain delete subadmin error:", error)
      return res.status(500).json({
        success: false,
        message: "Failed to delete subadmin on blockchain"
      })
    }

    await User.findByIdAndDelete(req.params.id)

    return res.status(200).json({
      success: true,
      message: "Subadmin deleted successfully"
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



/* =====================================================
   GET VOTER HISTORY
   Returns elections where the logged-in voter's wallet
   appears in the `voters` array.
===================================================== */

export const getVoterHistory = async (req, res) => {

  try {

    const { Election } = await import("../models/election.model.js")

    const wallet = req.user.walletAddress?.toLowerCase()

    if (!wallet) {
      return res.status(200).json({ success: true, history: [] })
    }

    const elections = await Election.find({
      voters: wallet
    }).select("title status createdAt")

    const history = elections.map(el => ({
      electionId: el._id.toString(),
      electionTitle: el.title,
      date: el.createdAt,
      status: el.status
    }))

    return res.status(200).json({
      success: true,
      history
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }

}

/* =====================================================
   GET ALL ORGANIZATIONS
===================================================== */

export const getOrganizations = async (req, res) => {
  try {
    const { Organization } = await import("../models/organization.model.js");
    const organizations = await Organization.find({}).sort({ name: 1 });
    
    if (req.query.detailed === "true") {
      return res.status(200).json({
        success: true,
        organizations
      });
    }

    // Return an array of names to match the frontend expectations
    const validOrgs = organizations.map(org => org.name);

    return res.status(200).json({
      success: true,
      organizations: validOrgs
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/* =====================================================
   CREATE ORGANIZATION (ADMIN ONLY)
===================================================== */

export const createOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create organizations"
      });
    }

    const { Organization } = await import("../models/organization.model.js");
    
    const normalizedName = name.toLowerCase().trim();
    const existing = await Organization.findOne({ name: normalizedName });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Organization already exists"
      });
    }

    const org = await Organization.create({
      name: normalizedName,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: org
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

/* =====================================================
   SEARCH VOTER BY WALLET (ADMIN / SUBADMIN)
===================================================== */

export const searchVoterByWallet = async (req, res) => {
  try {
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required for search"
      });
    }

    if (req.user.role !== "admin" && req.user.role !== "subadmin") {
      return res.status(403).json({
        success: false,
        message: "Only admins and subadmins can search voters"
      });
    }

    const organizationName = req.user.organizationName;
    
    const query = {
      role: "voter",
      walletAddress: new RegExp(wallet, 'i')
    };

    if (organizationName) {
      query.organizationName = organizationName;
    }

    const voters = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      voters
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}