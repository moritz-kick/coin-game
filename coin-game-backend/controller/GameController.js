const GameSchema = require("../models/GameSchema");
const UserSchema = require("../models/UserSchema");
const { getAISelection } = require("../utils/aiUtils");

// Function to create a game against another player
const createGame = async (req, res) => {
  try {
    const player1Id = req.user.id;
    const player2Id = req.params.id;

    const findedPlayer2 = await UserSchema.findById(player2Id);

    if (!findedPlayer2) {
      throw new Error("Player 2 not found");
    }

    // Randomly assign roles
    const roles = ["coin-player", "estimator"];
    const randomIndex = Math.floor(Math.random() * 2);
    const player1Role = roles[randomIndex];
    const player2Role = roles[1 - randomIndex];

    const game = await GameSchema.create({
      player1: player1Id,
      player2: player2Id,
      matches: req.body.matches || 3,
      player1Role: player1Role,
      player2Role: player2Role,
    });

    res.status(200).json({
      game,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Create a game against AI
const createAIGame = async (req, res) => {
  try {
    const player1Id = req.user.id;
    const { matches } = req.body;

    console.log('Creating AI game for player1Id:', player1Id);

    // Randomly assign roles
    const roles = ["coin-player", "estimator"];
    const randomIndex = Math.floor(Math.random() * 2);
    const player1Role = roles[randomIndex];
    const player2Role = player1Role === "coin-player" ? "estimator" : "coin-player";

    // Find the AI user
    const aiUser = await UserSchema.findOne({ deviceId: "AI" });
    if (!aiUser) {
      console.error('AI user not found');
      throw new Error("AI user not found");
    }

    console.log('AI user found:', aiUser);

    const game = await GameSchema.create({
      player1: player1Id,
      player2: aiUser._id,
      matches: matches || 3,
      player1Role: player1Role,
      player2Role: player2Role,
      isAIGame: true,
      aiDifficulty: "Standard",
    });

    console.log('Game created:', game);

    res.status(200).json({ game });
  } catch (error) {
    console.error('Error in createAIGame:', error);
    res.status(500).json({ error: error.message });
  }
};

const getGame = async (req, res) => {
  try {
    const game = await GameSchema.findById(req.params.id)
      .populate("player1", "username")
      .populate("player2", "username");

    res.status(200).json({
      game,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Adjusted submitRound function to handle AI games
const submitRound = async (socket, data) => {
  const { gameId, selection, actionBy } = data;

  try {
    const game = await GameSchema.findById(gameId);

    if (!game) {
      throw new Error("Game not found");
    }

    const currentRound = game.currentRound;
    const currentMatch = game.currentMatch;

    if (actionBy === "coin-player") {
      // Add coin selection
      game.coinSelections.push({
        round: currentRound,
        coins: selection,
        match: currentMatch,
      });
    } else if (actionBy === "estimator") {
      // Add guess
      game.guesses.push({
        round: currentRound,
        guess: selection,
        match: currentMatch,
      });
    }

    // Save the game
    await game.save();

    // If it's an AI game, handle AI's move
    if (game.isAIGame) {
      await handleAIMove(game, socket);
    } else {
      // For multiplayer games
      socket.to(gameId).emit("roundSubmitted", game);

      // Check if both players have submitted for this round
      const coinSelection = game.coinSelections.find(
        (cs) => cs.round === currentRound && cs.match === currentMatch
      );
      const guess = game.guesses.find(
        (g) => g.round === currentRound && g.match === currentMatch
      );

      if (coinSelection && guess) {
        // Both players have submitted, proceed to next round or match
        await processRoundOutcome(game, socket);
      }
    }
  } catch (error) {
    console.error(error);
    socket.emit("error", { message: error.message });
  }
};

// Handle AI's move
const handleAIMove = async (game, socket) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;
  const aiRole = game.player2Role; // Since player2 is AI
  let aiSelection;

  if (aiRole === "coin-player") {
    // AI selects coins
    aiSelection = await getAISelection(game, "coin-player");
    game.coinSelections.push({
      round: currentRound,
      coins: aiSelection,
      match: currentMatch,
    });
  } else if (aiRole === "estimator") {
    // AI makes a guess
    aiSelection = await getAISelection(game, "estimator");
    game.guesses.push({
      round: currentRound,
      guess: aiSelection,
      match: currentMatch,
    });
  }

  // Save the game
  await game.save();

  // Proceed to process round outcome
  await processRoundOutcome(game, socket);
};

module.exports = {
  createGame,
  createAIGame,
  getGame,
  submitRound,
};
