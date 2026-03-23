import { User } from "../models/user.model.js"
import { contract } from "../utils/blockchain.js"
import { ethers } from "ethers"



/* =====================================================
   LOGIN USER
===================================================== */

export const loginUser = async (req, res) => {
  try {

    const { email, password, walletAddress } = req.body

    if (!email || !password || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Email, password and wallet address are required"
      })
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address"
      })
    }

    const wallet = walletAddress.toLowerCase()

    const user = await User.findOne({
      email,
      walletAddress: wallet
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or wallet does not match"
      })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    if (user.role === "voter" && user.isApproved !== true) {
      return res.status(403).json({
        success: false,
        message: "Your account is waiting for approval"
      })
    }

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

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userData,
        accessToken
      }
    })

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    })

  }
}



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
  walletAddress
} = req.body

if (!fullName || !email || !aadhaarId || !role || !password || !walletAddress) {
  return res.status(400).json({
    success: false,
    message: "All fields are required"
  })
}
 
if (!ethers.isAddress(walletAddress)) {
  return res.status(400).json({
    success: false,
    message: "Invalid wallet address"
  })
}

const wallet = walletAddress.toLowerCase()

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

const approvalStatus = role === "voter" ? null : true

const user = await User.create({
  fullName,
  email,
  aadhaarId,
  role,
  password,
  walletAddress: wallet,
  isApproved: approvalStatus
})

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

    const user = await User.findById(req.params.id)

    if (!user || user.role !== "voter") {
      return res.status(404).json({
        success: false,
        message: "Voter not found"
      })
    }

    /* ---------- Update DB status ---------- */

    user.isApproved = approved
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
   GET ALL VOTERS
===================================================== */

export const getVoters = async (req, res) => {

  try {

    const voters = await User
      .find({ role: "voter" })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })


    return res.status(200).json({
      success: true,
      voters
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

    const { fullName, email, walletAddress, aadhaarId, password } = req.body

    if (!fullName || !email || !walletAddress || !aadhaarId || !password) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })

    }


    const wallet = walletAddress.toLowerCase()


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


    const subadmin = await User.create({
      fullName,
      email,
      walletAddress: wallet,
      aadhaarId,
      password,
      role: "subadmin",
      isApproved: true,
      isActive: true
    })


    /* ---------- Register SubAdmin on Blockchain ---------- */

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


    return res.status(200).json({
      success: true,
      subadmins
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

    user.isActive = !user.isActive

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