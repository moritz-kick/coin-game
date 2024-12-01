// GameController.js
const GameSchema = require("../models/GameSchema");
const UserSchema = require("../models/UserSchema");
const { getAISelection } = require("../utils/aiUtils");

/**
 * Function to create a game against another player
 */
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

    console.log(`Game created between ${player1Id} and ${player2Id}:`, game);

    res.status(200).json({
      game,
    });
  } catch (error) {
    console.error("Error in createGame:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * Create a game against AI
 */
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

    console.log('AI Game created:', game);

    res.status(200).json({ game });
  } catch (error) {
    console.error('Error in createAIGame:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a specific game
 */
const getGame = async (req, res) => {
  try {
    const game = await GameSchema.findById(req.params.id)
      .populate("player1", "username")
      .populate("player2", "username");

    res.status(200).json({
      game,
    });
  } catch (error) {
    console.error("Error in getGame:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * Function to process the outcome of a round
 */
const processRoundOutcome = async (game, io) => {
  console.log(`Processing round outcome for game ${game._id}, Round ${game.currentRound}, Match ${game.currentMatch}`);

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

  console.log(`Coin selection: ${coinSelection.coins}, Guess: ${guess.guess}`);

  // Determine the winner of the round
  let matchEnded = false;
  let matchWinner = null;

  // Check if the estimator guessed correctly
  if (coinSelection.coins === guess.guess) {
    // Estimator wins the match immediately
    matchWinner = game.player1Role === "estimator" ? game.player1 : game.player2;
    console.log(`Estimator guessed correctly. Winner: ${matchWinner}`);
    matchEnded = true;
  } else {
    // Estimator did not guess correctly, increment the round
    game.currentRound += 1;
    console.log(`Estimator did not guess correctly. Incrementing round to ${game.currentRound}`);

    // Check if maximum rounds have been reached
    if (game.currentRound > game.rounds) {
      // Coin player wins the match
      matchWinner = game.player1Role === "coin-player" ? game.player1 : game.player2;
      console.log(`Maximum rounds reached. Coin Player wins. Winner: ${matchWinner}`);
      matchEnded = true;
    }
  }

  if (matchEnded) {
    // Record the match winner
    game.matchWinners.push({
      match: currentMatch,
      winner: matchWinner,
    });
    console.log(`Match winner recorded: ${matchWinner}`);

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
        console.log(`Updated stats: Winner (${matchWinner}) wins incremented, Loser (${loser}) losses incremented.`);
      } else {
        // Update AI stats for Standard mode
        const aiPlayer = game.player2; // AI is always player2
        const humanPlayer = game.player1;

        if (matchWinner.toString() === humanPlayer.toString()) {
          // Human won against AI
          const lossField = "aiLosses"; // Fixed since only one mode
          await UserSchema.findByIdAndUpdate(humanPlayer, {
            $inc: { [lossField]: 1 },
          });
          console.log(`Human won against AI. Updated aiLosses.`);
        } else if (matchWinner.toString() === aiPlayer.toString()) {
          // AI won against Human
          const winField = "aiWins"; // Fixed since only one mode
          await UserSchema.findByIdAndUpdate(humanPlayer, {
            $inc: { [winField]: 1 },
          });
          console.log(`AI won against Human. Updated aiWins.`);
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
    console.log(`Swapped roles: player1Role=${game.player1Role}, player2Role=${game.player2Role}`);

    // Move to the next match
    game.currentMatch += 1;
    game.currentRound = 1;
    console.log(`Moved to next match: ${game.currentMatch}`);

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
        console.log(`Overall game winner: ${game.player1}`);
      } else if (player2Wins > player1Wins) {
        game.winner = game.player2;
        console.log(`Overall game winner: ${game.player2}`);
      }

      game.status = "completed";
      await game.save();
      console.log(`Game ${game._id} completed.`);

      // Notify clients that the game is completed
      const populatedGame = await GameSchema.findById(game._id)
        .populate("player1", "username")
        .populate("player2", "username")
        .populate("winner", "username");

      io.to(game._id.toString()).emit("gameCompleted", populatedGame);
      console.log(`Emitted 'gameCompleted' for game ${game._id}`);
    } else {
      // Save the game and notify clients that the match is completed
      await game.save();
      console.log(`Saved game ${game._id} after match completion.`);
      const populatedGame = await GameSchema.findById(game._id)
        .populate("player1", "username")
        .populate("player2", "username");
      io.to(game._id.toString()).emit("matchCompleted", populatedGame);
      console.log(`Emitted 'matchCompleted' for game ${game._id}`);
    }
  } else {
    // If the match hasn't ended, save the game and proceed to the next round
    await game.save();
    console.log(`Saved game ${game._id} for next round.`);
    const populatedGame = await GameSchema.findById(game._id)
      .populate("player1", "username")
      .populate("player2", "username");
    io.to(game._id.toString()).emit("roundChanged", populatedGame);
    console.log(`Emitted 'roundChanged' for game ${game._id}`);
  }
};

/**
 * Handle AI's move
 */
const handleAIMove = async (game, io) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;
  const aiRole = game.player2Role; // AI is always player2
  let aiSelection;

  console.log(`Handling AI move for game ${game._id}, Round ${currentRound}, Match ${currentMatch}, AI Role: ${aiRole}`);

  if (aiRole === "coin-player") {
    // AI selects coins
    aiSelection = await getAISelection(game, "coin-player");
    console.log(`AI (role: coin-player) selected coins: ${aiSelection}`);
    game.coinSelections.push({
      round: currentRound,
      coins: aiSelection,
      match: currentMatch,
    });
  } else if (aiRole === "estimator") {
    // AI makes a guess
    aiSelection = await getAISelection(game, "estimator");
    console.log(`AI (role: estimator) made a guess: ${aiSelection}`);
    game.guesses.push({
      round: currentRound,
      guess: aiSelection,
      match: currentMatch,
    });
  }

  // Save the game
  await game.save();
  console.log(`AI's move saved for game ${game._id}`);

  // Proceed to process round outcome
  await processRoundOutcome(game, io);
};

/**
 * Submit round (handles both multiplayer and AI games)
 */
const submitRound = async (socket, data, io) => {
  const { gameId, selection, actionBy } = data;

  console.log(`Received 'submitRound' event for game ${gameId} from actionBy: ${actionBy} with selection: ${selection}`);

  try {
    const game = await GameSchema.findById(gameId);

    if (!game) {
      console.error(`Game ${gameId} not found.`);
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
      console.log(`Player submitted coins: ${selection} for game ${gameId}, Round ${currentRound}, Match ${currentMatch}`);
    } else if (actionBy === "estimator") {
      game.guesses.push({
        round: currentRound,
        guess: selection,
        match: currentMatch,
      });
      console.log(`Player submitted guess: ${selection} for game ${gameId}, Round ${currentRound}, Match ${currentMatch}`);
    } else {
      console.error(`Invalid actionBy value: ${actionBy}`);
      socket.emit("error", { message: "Invalid actionBy value" });
      return;
    }

    // Save the game
    await game.save();
    console.log(`Game ${game._id} saved after player submission.`);

    if (game.isAIGame) {
      console.log(`Game ${game._id} is an AI game. Handling AI move.`);
      await handleAIMove(game, io);
    } else {
      // Populate player1, player2, and winner before emitting
      const populatedGame = await GameSchema.findById(gameId)
        .populate("player1", "username")
        .populate("player2", "username")
        .populate("winner", "username");

      io.to(gameId).emit("roundSubmitted", populatedGame);
      console.log(`Emitted 'roundSubmitted' for game ${game._id}`);

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
        console.log(`Both players have submitted for game ${game._id}. Processing round outcome.`);
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
