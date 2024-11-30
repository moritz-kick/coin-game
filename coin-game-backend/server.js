const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const userRouter = require("./routes/UserRoutes");
const UserSchema = require("./models/UserSchema");
const gameRouter = require("./routes/GameRoutes");
const GameSchema = require("./models/GameSchema");
const { handleAIMove } = require("./controller/GameController");
const { getAISelection } = require("./utils/aiUtils");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Initialize AI User
const initializeAIUser = async () => {
  try {
    let aiUser = await UserSchema.findOne({ deviceId: "AI" });
    if (!aiUser) {
      aiUser = await UserSchema.create({
        username: "AI",
        deviceId: "AI",
        status: "offline",
      });
      console.log("AI user created.");
    }
  } catch (error) {
    console.error("Error initializing AI user:", error);
  }
};

initializeAIUser();

// CORS configuration
app.use(
  cors({
    origin: "https://coin-game-five.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Parse JSON bodies
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/user", userRouter);
app.use("/game", gameRouter);

io.on("connection", (socket) => {
  console.log("User connected");

  const socketId = socket.id;

  // Handle user joining the waiting room
  socket.on("joinWaitingRoom", async (userId) => {
    try {
      console.log(
        `User ${userId} is joining the waiting room with socket ID: ${socketId}`
      );
      socket.join("waitingRoom");
      socket.join(userId);

      const updateUserStatus = await UserSchema.findByIdAndUpdate(
        userId,
        { status: "online", socketId },
        { new: true }
      );

      if (updateUserStatus) {
        console.log(
          `User ${userId} status updated to online with socket ID: ${socketId}`
        );
      } else {
        console.log(`Failed to update status for user ${userId}`);
      }

      io.to("waitingRoom").emit("updateWaitingRoom", updateUserStatus);
    } catch (error) {
      console.error(`Error joining waiting room for user ${userId}:`, error);
    }
  });

  // Handle user leaving the game
  socket.on("userLeft", async ({ userId, gameId }) => {
    try {
      console.log(`User ${userId} is leaving the game ${gameId}`);

      await UserSchema.findByIdAndUpdate(
        userId,
        { status: "offline", socketId: "" },
        { new: true }
      );

      const findedGame = await GameSchema.findById(gameId);

      if (findedGame) {
        console.log(
          `Found game ${gameId}. Processing user ${userId} leaving.`
        );
        const winner =
          findedGame.player1.toString() === userId
            ? findedGame.player2
            : findedGame.player1;
        const loser = userId;

        await UserSchema.findByIdAndUpdate(
          winner,
          { $inc: { wins: 1 }, status: "online" },
          { new: true }
        );

        await UserSchema.findByIdAndUpdate(
          loser,
          { $inc: { losses: 1 }, status: "offline" },
          { new: true }
        );

        const updatedGame = await GameSchema.findByIdAndUpdate(
          findedGame._id,
          {
            status: "aborted",
            winner,
          },
          { new: true }
        )
          .populate("player1", "username")
          .populate("player2", "username")
          .populate("winner", "username");

        io.to(gameId).emit("gameAborted", updatedGame);
        console.log(
          `Game ${gameId} was aborted due to user ${userId} leaving.`
        );
      } else {
        console.log(`Game ${gameId} not found for user ${userId}`);
      }
    } catch (error) {
      console.error(
        `Error handling user ${userId} leaving game ${gameId}:`,
        error
      );
    }
  });

  // Handle challenge requests
  socket.on(
    "challengeUser",
    async ({ challengerId, challengedId, matches }) => {
      try {
        const challenger = await UserSchema.findById(challengerId);
        const challenged = await UserSchema.findById(challengedId);

        if (!challenger || !challenged) {
          socket.emit("error", { message: "Challenger or challenged user not found." });
          return;
        }

        io.to(challenged.socketId).emit("challengeReceived", {
          challenger,
          challenged,
          matches,
        });
      } catch (error) {
        console.error("Error handling challengeUser event:", error);
        socket.emit("error", { message: "Failed to process challenge." });
      }
    }
  );

  // Handle acceptance of challenge
  socket.on(
    "acceptChallenge",
    async ({ challengerId, challengedId, matches }) => {
      try {
        const findedPlayer1 = await UserSchema.findById(challengerId);
        const findedPlayer2 = await UserSchema.findById(challengedId);

        if (!findedPlayer1 || !findedPlayer2) {
          socket.emit("error", { message: "Challenger or challenged user not found." });
          return;
        }

        // Randomly assign roles
        const roles = ["coin-player", "estimator"];
        const randomIndex = Math.floor(Math.random() * 2);
        const player1Role = roles[randomIndex];
        const player2Role = roles[1 - randomIndex];

        const game = await GameSchema.create({
          player1: findedPlayer1._id,
          player2: findedPlayer2._id,
          player1Role: player1Role,
          player2Role: player2Role,
          matches: parseInt(matches) || 3,
          isAIGame: false,
          aiDifficulty: "Standard", // Fixed since only one mode
        });

        const gameID = game._id.toString();

        socket.join(gameID);
        io.to(findedPlayer1.socketId).socketsJoin(gameID);
        io.to(findedPlayer2.socketId).socketsJoin(gameID);

        await UserSchema.findByIdAndUpdate(challengerId, {
          status: "in-game",
        });

        await UserSchema.findByIdAndUpdate(challengedId, {
          status: "in-game",
        });

        const populatedGame = await GameSchema.findById(gameID)
          .populate("player1", "username")
          .populate("player2", "username");

        io.to(gameID).emit("gameCreated", {
          gameId: gameID,
          game: populatedGame,
        });
      } catch (err) {
        console.error("Error handling acceptChallenge event:", err);
        socket.emit("error", { message: "Failed to create game." });
      }
    }
  );

  // Handle round submissions
  socket.on("submitRound", async ({ gameId, actionBy, selection }) => {
    try {
      const game = await GameSchema.findById(gameId);

      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      if (actionBy === "coin-player") {
        game.coinSelections.push({
          round: game.currentRound,
          coins: +selection || 0,
          match: game.currentMatch,
        });
      } else if (actionBy === "estimator") {
        game.guesses.push({
          round: game.currentRound,
          guess: +selection || 0,
          match: game.currentMatch,
        });
      } else {
        socket.emit("error", { message: "Invalid actionBy value" });
        return;
      }

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
  });

  // Handle player timeout
  socket.on("playerTimeout", async ({ gameId, userId }) => {
    try {
      const game = await GameSchema.findById(gameId);
      if (!game) {
        socket.emit("error", { message: "Game not found" });
        return;
      }

      // Record that this player has timed out for the current round
      if (!game.timeouts) {
        game.timeouts = {};
      }
      if (!game.timeouts[game.currentRound]) {
        game.timeouts[game.currentRound] = {};
      }
      game.timeouts[game.currentRound][userId] = true;

      // Check if both players have timed out in this round
      const player1Id = game.player1.toString();
      const player2Id = game.player2.toString();

      const player1TimedOut =
        game.timeouts[game.currentRound][player1Id] || false;
      const player2TimedOut =
        game.timeouts[game.currentRound][player2Id] || false;

      if (player1TimedOut && player2TimedOut) {
        // Both players timed out
        game.status = "aborted";
        await game.save();

        // Notify clients
        io.to(gameId).emit("gameAbortedDueToTimeout", {
          message: "Both players didn't play in time",
        });

        // Update user statuses
        await UserSchema.findByIdAndUpdate(game.player1, { status: "online" });
        await UserSchema.findByIdAndUpdate(game.player2, { status: "online" });
      } else if (player1TimedOut || player2TimedOut) {
        // One player timed out
        const winner = player1TimedOut ? game.player2 : game.player1;
        const loser = player1TimedOut ? game.player1 : game.player2;

        // Update game status
        game.status = "completed";
        game.winner = winner;
        await game.save();

        // Update user stats
        await UserSchema.findByIdAndUpdate(winner, {
          $inc: { wins: 1 },
          status: "online",
        });
        await UserSchema.findByIdAndUpdate(loser, {
          $inc: { losses: 1 },
          status: "online",
        });

        // Notify clients
        const populatedGame = await GameSchema.findById(gameId)
          .populate("player1", "username")
          .populate("player2", "username")
          .populate("winner", "username");

        io.to(gameId).emit("gameCompletedDueToTimeout", {
          game: populatedGame,
          loserId: loser.toString(),
        });
      }
    } catch (error) {
      console.error("Error handling playerTimeout:", error);
      socket.emit("error", { message: error.message });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", async () => {
    try {
      console.log(`User with socket ID ${socketId} disconnected`);

      const disconnectedUser = await UserSchema.findOneAndUpdate(
        { socketId },
        { status: "offline", socketId: "" },
        { new: true }
      );

      if (disconnectedUser) {
        console.log(
          `User ${disconnectedUser.username} status updated to offline.`
        );
      } else {
        console.log(
          `User with socket ID ${socketId} disconnected, but no user was found in the database.`
        );
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

// Function to process round outcome
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

  // Flag to determine if the match has ended
  let matchEnded = false;
  let matchWinner = null;

  // Check if the estimator guessed correctly
  if (coinSelection.coins === guess.guess) {
    // Estimator wins the match immediately
    matchWinner =
      game.player1Role === "estimator" ? game.player1 : game.player2;
    matchEnded = true;
  } else {
    // Estimator did not guess correctly, increment the round
    game.currentRound += 1;

    // Check if maximum rounds have been reached
    if (game.currentRound > game.rounds) {
      // Coin player wins the match
      matchWinner =
        game.player1Role === "coin-player" ? game.player1 : game.player2;
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
        // logic for human players
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

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
