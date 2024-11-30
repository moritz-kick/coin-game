// server.js
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
const {
  submitRound,
  handleAIMove,
  processRoundOutcome,
} = require("./controller/GameController");

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
    } else {
      console.log("AI user already exists.");
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
          aiDifficulty: "Standard",
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

  // Handle round submissions using submitRound from GameController.js
  socket.on("submitRound", (data) => submitRound(socket, data, io));

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

// Function to process round outcome is now in GameController.js

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
