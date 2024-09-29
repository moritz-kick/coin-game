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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// CORS configuration
app.use(cors({
  origin: 'https://coin-game-five.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
        console.log(`User ${userId} is joining the waiting room with socket ID: ${socketId}`);
        socket.join("waitingRoom");
        socket.join(userId);

        const updateUserStatus = await UserSchema.findByIdAndUpdate(
            userId,
            { status: "online", socketId },
            { new: true }
        );

        if (updateUserStatus) {
            console.log(`User ${userId} status updated to online with socket ID: ${socketId}`);
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
            console.log(`Found game ${gameId}. Processing user ${userId} leaving.`);
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

            const updatedGame = await GameSchema.findByIdAndUpdate(findedGame._id, {
                status: "aborted",
                winner,
            });

            io.to(gameId).emit("gameAborted", updatedGame);
            console.log(`Game ${gameId} was aborted due to user ${userId} leaving.`);
        } else {
            console.log(`Game ${gameId} not found for user ${userId}`);
        }
    } catch (error) {
        console.error(`Error handling user ${userId} leaving game ${gameId}:`, error);
    }
  });

  // Handle challenge requests
  socket.on("challengeUser", async ({ challengerId, challengedId, matches }) => {
    const challenger = await UserSchema.findById(challengerId);
    const challenged = await UserSchema.findById(challengedId);

    io.to(challenged.socketId).emit("challengeReceived", {
      challenger,
      challenged,
      matches,
    });
  });

  // Handle acceptance of challenge
  socket.on(
    "acceptChallenge",
    async ({ challengerId, challengedId, matches }) => {
      const findedPlayer1 = await UserSchema.findById(challengerId);
      const findedPlayer2 = await UserSchema.findById(challengedId);

      try {
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
          matches: parseInt(matches),
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

        io.to(gameID).emit("gameCreated", { gameId: gameID });
      } catch (err) {
        console.log(err);
      }
    }
  );

  // Handle round submissions
  socket.on("submitRound", async ({ gameId, actionBy, selection }) => {
    const game = await GameSchema.findById(gameId);

    if (!game) return;

    if (actionBy === "coin-player") {
      game.coinSelections.push({
        round: game.currentRound,
        coins: +selection ?? 0,
        match: game.currentMatch,
      });
    } else {
      game.guesses.push({
        round: game.currentRound,
        guess: +selection ?? 0,
        match: game.currentMatch,
      });
    }

    await game.save();

    io.to(gameId).emit("roundSubmitted", game);

    // Check if both players have submitted
    const coinSelection = game.coinSelections.find(
      (cs) => cs.round === game.currentRound && cs.match === game.currentMatch
    );
    const guess = game.guesses.find(
      (g) => g.round === game.currentRound && g.match === game.currentMatch
    );

    if (coinSelection && guess) {
      // Process round outcome
      await processRoundOutcome(game, io);
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
              console.log(`User ${disconnectedUser.username} status updated to offline.`);
          } else {
              console.log(`User with socket ID ${socketId} disconnected, but no user was found in the database.`);
          }
      } catch (error) {
          console.error('Error handling disconnect:', error);
      }
  });
});

// Function to process round outcome
const processRoundOutcome = async (game, io) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;

  // Determine if the guess was correct
  const coinSelection = game.coinSelections.find(
    (cs) => cs.round === currentRound && cs.match === currentMatch
  );
  const guess = game.guesses.find(
    (g) => g.round === currentRound && g.match === currentMatch
  );

  let roundWinner = null;

  if (coinSelection.coins === guess.guess) {
    // Estimator wins the round
    if (game.player1Role === "estimator") {
      game.player1Score += 1;
    } else {
      game.player2Score += 1;
    }
  } else {
    // Coin player wins the round
    if (game.player1Role === "coin-player") {
      game.player1Score += 1;
    } else {
      game.player2Score += 1;
    }
  }

  // Update current round
  game.currentRound += 1;

  // Check if match is over
  if (game.currentRound > game.rounds) {
    // Determine match winner
    let matchWinner = null;

    if (game.player1Score > game.player2Score) {
      matchWinner = game.player1;
    } else if (game.player2Score > game.player1Score) {
      matchWinner = game.player2;
    } else {
      matchWinner = null; // Draw
    }

    game.matchWinners.push({
      match: currentMatch,
      winner: matchWinner,
    });

    // Reset scores for next match
    game.player1Score = 0;
    game.player2Score = 0;

    // Swap roles
    const tempRole = game.player1Role;
    game.player1Role = game.player2Role;
    game.player2Role = tempRole;

    // Update current match
    game.currentMatch += 1;
    game.currentRound = 1;

    // Check if game is over
    if (game.currentMatch > game.matches) {
      // Determine game winner
      let player1Wins = game.matchWinners.filter(
        (w) => w.winner && w.winner.toString() === game.player1.toString()
      ).length;
      let player2Wins = game.matchWinners.filter(
        (w) => w.winner && w.winner.toString() === game.player2.toString()
      ).length;

      if (player1Wins > player2Wins) {
        game.winner = game.player1;
        await UserSchema.findByIdAndUpdate(game.player1, {
          $inc: { wins: 1 },
          status: "online",
        });
        await UserSchema.findByIdAndUpdate(game.player2, {
          $inc: { losses: 1 },
          status: "online",
        });
      } else if (player2Wins > player1Wins) {
        game.winner = game.player2;
        await UserSchema.findByIdAndUpdate(game.player2, {
          $inc: { wins: 1 },
          status: "online",
        });
        await UserSchema.findByIdAndUpdate(game.player1, {
          $inc: { losses: 1 },
          status: "online",
        });
      } else {
        // It's a draw
        game.winner = null;
        await UserSchema.findByIdAndUpdate(game.player1, {
          status: "online",
        });
        await UserSchema.findByIdAndUpdate(game.player2, {
          status: "online",
        });
      }

      game.status = "completed";
      await game.save();

      io.to(game._id.toString()).emit("gameCompleted", game);
    } else {
      await game.save();
      io.to(game._id.toString()).emit("matchCompleted", game);
    }
  } else {
    await game.save();
    io.to(game._id.toString()).emit("roundChanged", game);
  }
};

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
