import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },

    aadhaarId: {
      type: String,
      required: true,
      unique: true, // 🔥 add this to prevent duplicates
    },

    role: {
      type: String,
      enum: ["admin", "subadmin", "voter"],
      required: true,
    },

    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // 🔥 normalize
      trim: true,
    },

    isApproved: {
      type: Boolean,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    password: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//
// ✅ FIXED PRE-SAVE HOOK (NO next)
//
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

//
// ✅ PASSWORD CHECK
//
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

//
// ✅ ACCESS TOKEN
//
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

//
// ✅ REFRESH TOKEN
//
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
