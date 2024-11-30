// GameController.js
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

// Get a specific game
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

// Function to process the outcome of a round
const processRoundOutcome = async (game, io) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;

  // Retrieve the current coin selection and guess
  const coinSelection = game.coinSelections.find(
    (cs) => cs.round === currentRound && cs.match === currentMatch
  );
  const guess = game.guesses.find(
    (g) => g.round === currentRound && g.match === currentMatch
  );

  // Validate selections
  if (!coinSelection || !guess) {
    console.error(
      `Incomplete data for game ${game._id}:`,
      { coinSelection, guess }
    );
    io.to(game._id.toString()).emit("error", { message: "Incomplete round data." });
    return;
  }

  // Determine the winner of the round
  let matchEnded = false;
  let matchWinner = null;

  // Check if the estimator guessed correctly
  if (coinSelection.coins === guess.guess) {
    // Estimator wins the match immediately
    matchWinner = game.player1Role === "estimator" ? game.player1 : game.player2;
    matchEnded = true;
  } else {
    // Estimator did not guess correctly, increment the round
    game.currentRound += 1;

    // Check if maximum rounds have been reached
    if (game.currentRound > game.rounds) {
      // Coin player wins the match
      matchWinner = game.player1Role === "coin-player" ? game.player1 : game.player2;
      matchEnded = true;
    }
  }

  if (matchEnded) {
    // Record the match winner
    game.matchWinners.push({
      match: currentMatch,
      winner: matchWinner,
    });

    // Update user stats after each match
    if (matchWinner) {
      if (!game.isAIGame) {
        // Logic for human players
        await UserSchema.findByIdAndUpdate(matchWinner, {
          $inc: { wins: 1 },
        });
        const loser =
          matchWinner.toString() === game.player1.toString()
            ? game.player2
            : game.player1;
        await UserSchema.findByIdAndUpdate(loser, {
          $inc: { losses: 1 },
        });
      } else {
        // Update AI stats for Standard mode
        const difficulty = game.aiDifficulty;

        // Identify AI and Human players
        const aiPlayer = game.player2; // Since player2 is always AI
        const humanPlayer = game.player1;

        if (matchWinner.toString() === humanPlayer.toString()) {
          // Human won against AI
          const lossField = "aiLosses"; // Fixed since only one mode
          await UserSchema.findByIdAndUpdate(humanPlayer, {
            $inc: { [lossField]: 1 },
          });
        } else if (matchWinner.toString() === aiPlayer.toString()) {
          // AI won against Human
          const winField = "aiWins"; // Fixed since only one mode
          await UserSchema.findByIdAndUpdate(humanPlayer, {
            $inc: { [winField]: 1 },
          });
        } else {
          console.error(
            `Match winner ${matchWinner} is neither human (${humanPlayer}) nor AI (${aiPlayer}) in game ${game._id}.`
          );
        }
      }
    }

    // Reset scores and swap roles for next match
    game.player1Score = 0;
    game.player2Score = 0;
    const tempRole = game.player1Role;
    game.player1Role = game.player2Role;
    game.player2Role = tempRole;

    // Move to the next match
    game.currentMatch += 1;
    game.currentRound = 1;

    // Check if game is over
    if (game.currentMatch > game.matches) {
      // Determine overall game winner based on match wins
      let player1Wins = game.matchWinners.filter(
        (w) => w.winner && w.winner.toString() === game.player1.toString()
      ).length;
      let player2Wins = game.matchWinners.filter(
        (w) => w.winner && w.winner.toString() === game.player2.toString()
      ).length;

      if (player1Wins > player2Wins) {
        game.winner = game.player1;
      } else if (player2Wins > player1Wins) {
        game.winner = game.player2;
      }

      game.status = "completed";
      await game.save();

      // Notify clients that the game is completed
      const populatedGame = await GameSchema.findById(game._id)
        .populate("player1", "username")
        .populate("player2", "username")
        .populate("winner", "username");

      io.to(game._id.toString()).emit("gameCompleted", populatedGame);
    } else {
      // Save the game and notify clients that the match is completed
      await game.save();
      const populatedGame = await GameSchema.findById(game._id)
        .populate("player1", "username")
        .populate("player2", "username");
      io.to(game._id.toString()).emit("matchCompleted", populatedGame);
    }
  } else {
    // If the match hasn't ended, save the game and proceed to the next round
    await game.save();
    const populatedGame = await GameSchema.findById(game._id)
      .populate("player1", "username")
      .populate("player2", "username");
    io.to(game._id.toString()).emit("roundChanged", populatedGame);
  }
};

// Handle AI's move
const handleAIMove = async (game, io) => {
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
  await processRoundOutcome(game, io);
};

// Submit round (handles both multiplayer and AI games)
const submitRound = async (socket, data, io) => {
  const { gameId, selection, actionBy } = data;

  try {
    const game = await GameSchema.findById(gameId);

    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    const currentRound = game.currentRound;
    const currentMatch = game.currentMatch;

    if (actionBy === "coin-player") {
      game.coinSelections.push({
        round: currentRound,
        coins: selection,
        match: currentMatch,
      });
    } else if (actionBy === "estimator") {
      game.guesses.push({
        round: currentRound,
        guess: selection,
        match: currentMatch,
      });
    } else {
      socket.emit("error", { message: "Invalid actionBy value" });
      return;
    }

    // Save the game
    await game.save();

    if (game.isAIGame) {
      await handleAIMove(game, io);
    } else {
      // Populate player1, player2, and winner before emitting
      const populatedGame = await GameSchema.findById(gameId)
        .populate("player1", "username")
        .populate("player2", "username")
        .populate("winner", "username");

      io.to(gameId).emit("roundSubmitted", populatedGame);

      // Check if both players have submitted
      const coinSelection = game.coinSelections.find(
        (cs) =>
          cs.round === game.currentRound && cs.match === game.currentMatch
      );
      const guess = game.guesses.find(
        (g) =>
          g.round === game.currentRound && g.match === game.currentMatch
      );

      if (coinSelection && guess) {
        // Process round outcome
        await processRoundOutcome(game, io);
      }
    }
  } catch (error) {
    console.error("Error in submitRound:", error);
    socket.emit("error", { message: error.message });
  }
};

module.exports = {
  createGame,
  createAIGame,
  getGame,
  submitRound,
  handleAIMove,
  processRoundOutcome,
};
