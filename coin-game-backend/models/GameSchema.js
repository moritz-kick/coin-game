const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  levels: {
    type: Number,
    default: 3,
  },
  currentLevel: {
    type: Number,
    default: 1,
  },
  rounds: {
    type: Number,
    default: 3,
  },
  currentRound: {
    type: Number,
    default: 1,
  },
  player1Role: {
    type: String,
    default: "coin-player",
    enum: ["coin-player", "estimator"],
  },
  player2Role: {
    type: String,
    default: "estimator",
    enum: ["coin-player", "estimator"],
  },
  coinSelections: [
    {
      round: Number,
      coins: Number,
      level: Number,
    },
  ],
  guesses: [
    {
      round: Number,
      guess: Number,
      level: Number,
    },
  ],

  levelWinners: [
    {
      level: Number,
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    default: "in-progress",
    enum: ["in-progress", "completed", "aborted"],
  },
});

module.exports = mongoose.model("Game", GameSchema);
