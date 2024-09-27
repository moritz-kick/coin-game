const GameSchema = require("../models/GameSchema");
const UserSchema = require("../models/UserSchema");

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

// NEW FUNCTION: Create a game against AI
const createAIGame = async (req, res) => {
  try {
    const player1Id = req.user.id;
    const { difficulty, matches } = req.body;

    // Randomly assign roles
    const roles = ["coin-player", "estimator"];
    const randomIndex = Math.floor(Math.random() * 2);
    const player1Role = roles[randomIndex];

    const game = await GameSchema.create({
      player1: player1Id,
      matches: matches || 3,
      player1Role: player1Role,
      player2Role: player1Role === "coin-player" ? "estimator" : "coin-player",
      isAIGame: true,
      aiDifficulty: difficulty,
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

// NEW FUNCTION: Handle AI's move
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

// Placeholder function to get AI's selection
const getAISelection = async (game, role) => {
  // Implement AI logic based on game.aiDifficulty
  // For now, return random valid choice
  const validChoices = [0, 1, 2, 3, 4, 5];
  const randomIndex = Math.floor(Math.random() * validChoices.length);
  return validChoices[randomIndex];
};

// Function to process round outcome
const processRoundOutcome = async (game, socket) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;

  // Implement logic to determine round winner, update scores, etc.

  // For now, increment round or match
  game.currentRound += 1;

  if (game.currentRound > game.rounds) {
    game.currentRound = 1;
    game.currentMatch += 1;

    // Determine match winner
    const matchWinner = await determineMatchWinner(game);
    game.matchWinners.push({
      match: currentMatch,
      winner: matchWinner,
    });

    // Swap roles
    const tempRole = game.player1Role;
    game.player1Role = game.player2Role;
    game.player2Role = tempRole;

    // Check if the currentMatch exceeds total matches
    if (game.currentMatch > game.matches) {
      game.status = "completed";
      // Determine game winner
      game.winner = await determineGameWinner(game);
      // Emit 'gameCompleted' event
      socket.to(game._id.toString()).emit("gameCompleted", game);
    } else {
      // Emit 'matchCompleted' event
      socket.to(game._id.toString()).emit("matchCompleted", game);
    }
  } else {
    // Emit 'roundChanged' to clients
    socket.to(game._id.toString()).emit("roundChanged", game);
  }

  // Save game
  await game.save();
};

// Placeholder function to determine match winner
const determineMatchWinner = async (game) => {
  // Implement your logic to determine the match winner
  // For now, randomly select winner
  const randomWinner =
    Math.random() > 0.5 ? game.player1 : game.player2 || null;
  return randomWinner;
};

// Placeholder function to determine game winner
const determineGameWinner = async (game) => {
  // Implement your logic to determine the overall game winner
  // For now, randomly select winner
  const randomWinner =
    Math.random() > 0.5 ? game.player1 : game.player2 || null;

  // Update user statistics
  if (game.isAIGame) {
    const user = await UserSchema.findById(game.player1);
    if (randomWinner && randomWinner.toString() === game.player1.toString()) {
      // Player won against AI
      if (game.aiDifficulty === "Easy") {
        user.aiEasyWins += 1;
      } else {
        user.aiHardWins += 1;
      }
    } else {
      // Player lost against AI
      if (game.aiDifficulty === "Easy") {
        user.aiEasyLosses += 1;
      } else {
        user.aiHardLosses += 1;
      }
    }
    await user.save();
  } else {
    // Update statistics for multiplayer games
    const player1 = await UserSchema.findById(game.player1);
    const player2 = await UserSchema.findById(game.player2);

    if (randomWinner && randomWinner.toString() === game.player1.toString()) {
      player1.wins += 1;
      player2.losses += 1;
    } else if (randomWinner) {
      player2.wins += 1;
      player1.losses += 1;
    }

    await player1.save();
    await player2.save();
  }

  return randomWinner;
};

module.exports = {
  createGame,
  createAIGame,
  getGame,
  submitRound,
};
