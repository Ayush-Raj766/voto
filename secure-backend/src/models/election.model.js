import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Candidate Schema (Embedded)
 */
const candidateSchema = new Schema(
  {
    id: {
      type: Number,
      required: true, // blockchain candidate id
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    party: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    votes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false } // prevent MongoDB ObjectId
);

/**
 * Election Schema
 */
const electionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
    },

    blockchainId: {
      type: Number,
      default: null,
    },

    totalVotes: {
      type: Number,
      default: 0,
    },

    candidates: [candidateSchema],

    voters: [
      {
        type: String, // walletAddress
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Convert _id → id for frontend
 */
electionSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Election = mongoose.model("Election", electionSchema);