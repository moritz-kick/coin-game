const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    // NEW FIELDS FOR AI STATS
    aiEasyWins: {
      type: Number,
      default: 0,
    },
    aiEasyLosses: {
      type: Number,
      default: 0,
    },
    aiHardWins: {
      type: Number,
      default: 0,
    },
    aiHardLosses: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "online",
      enum: ["online", "offline", "in-game"],
    },
    socketId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
