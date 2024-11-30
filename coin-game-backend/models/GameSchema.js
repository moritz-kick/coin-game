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
  },
  matches: {
    type: Number,
    default: 3,
  },
  currentMatch: {
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
    enum: ["coin-player", "estimator"],
  },
  player2Role: {
    type: String,
    enum: ["coin-player", "estimator"],
  },
  coinSelections: [
    {
      round: Number,
      coins: Number,
      match: Number,
    },
  ],
  guesses: [
    {
      round: Number,
      guess: Number,
      match: Number,
    },
  ],
  matchWinners: [
    {
      match: Number,
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
  player1Score: {
    type: Number,
    default: 0,
  },
  player2Score: {
    type: Number,
    default: 0,
  },
  isAIGame: {
    type: Boolean,
    default: false,
  },
  aiDifficulty: {
    type: String,
    enum: ["Easy", "Hard", "Standard"],
  },
  timeouts: {
    type: Map,
    of: Map,
    default: {},
  },
});

module.exports = mongoose.model("Game", GameSchema);
