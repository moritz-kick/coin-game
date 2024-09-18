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

app.use(cors());
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

  socket.on("joinWaitingRoom", async (userId) => {
    socket.join("waitingRoom");

    socket.join(userId);

    // Notify all clients in waiting room

    const updateUserStatus = await UserSchema.findByIdAndUpdate(
      userId,
      {
        status: "online",
        socketId,
      },
      { new: true }
    );

    io.to("waitingRoom").emit("updateWaitingRoom", updateUserStatus);
  });

  socket.on("userLeft", async ({ userId, gameId }) => {
    // socket.leave("waitingRoom");

    await UserSchema.findByIdAndUpdate(
      userId,
      {
        status: "offline",
      },
      { new: true }
    );

    const findedGame = await GameSchema.findById(gameId);

    const winner =
      findedGame.player1.toString() === userId
        ? findedGame.player2
        : findedGame.player1;
    const loser =
      findedGame.player1.toString() === userId
        ? findedGame.player1
        : findedGame.player2;

    await UserSchema.findByIdAndUpdate(
      winner,
      { $inc: { wins: 1 }, status: "online" },
      { new: true }
    );

    await UserSchema.findByIdAndUpdate(
      loser,
      { $inc: { losses: 1 }, status: "online" },
      { new: true }
    );

    const updatedGame = await GameSchema.findByIdAndUpdate(findedGame._id, {
      status: "aborted",
      winner,
    });

    io.to(gameId).emit("gameAborted", updatedGame);
  });

  socket.on("challengeUser", async ({ challengerId, challengedId, levels }) => {
    const challenger = await UserSchema.findById(challengerId);
    const challenged = await UserSchema.findById(challengedId);

    io.to(challengedId).emit("challengeReceived", {
      challenger,
      challenged,
      levels,
    });
  });

  socket.on(
    "acceptChallenge",
    async ({ challengerId, challengedId, levels }) => {
      const findedPlayer1 = await UserSchema.findById(challengerId);
      const findedPlayer2 = await UserSchema.findById(challengedId);

      try {
        const game = await GameSchema.create({
          player1: findedPlayer1._id,
          player2: findedPlayer2._id,
          player1Role:
            findedPlayer1?.createdAt < findedPlayer2?.createdAt
              ? "coin-player"
              : "estimator",
          player2Role:
            findedPlayer1?.createdAt < findedPlayer2?.createdAt
              ? "estimator"
              : "coin-player",
          levels: parseInt(levels),
        });

        const gameID = game._id.toString();

        socket.join(gameID);
        io.to(challengerId).socketsJoin(gameID);
        io.to(challengedId).socketsJoin(gameID);

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

  socket.on("submitRound", async ({ gameId, actionBy, selection }) => {
    let updatedGame = null;

    const findedGame = await GameSchema.findById(gameId);

    if (actionBy === "coin-player") {
      updatedGame = await GameSchema.findByIdAndUpdate(
        gameId,
        {
          coinSelections: [
            ...findedGame.coinSelections,
            {
              round: findedGame.currentRound,
              coins: +selection ?? 0,
              level: findedGame.currentLevel,
            },
          ],
        },
        { new: true }
      );
    } else {
      updatedGame = await GameSchema.findByIdAndUpdate(
        gameId,
        {
          guesses: [
            ...findedGame.guesses,
            {
              round: findedGame.currentRound,
              guess: +selection ?? 0,
              level: findedGame.currentLevel,
            },
          ],
        },
        { new: true }
      );
    }

    io.to(gameId).emit("roundSubmitted", updatedGame);
  });

  socket.on("changeRound", async ({ gameId, level }) => {
    const findedGame = await GameSchema.findById(gameId);

    const findedPlayer1 = await UserSchema.findById(findedGame.player1);
    const findedPlayer2 = await UserSchema.findById(findedGame.player2);

    // const isGuessCorrect = +guess === +coinSelections;

    // Determine the winner
    let levelWinner = null;
    let incorrectGuesses = 0;

    for (let i = 0; i < findedGame.guesses.length; i++) {
      if (findedGame.guesses[i].level === findedGame.currentLevel) {
        const currentGuess = findedGame.guesses[i].guess;
        const currentSelection = findedGame.coinSelections[i].coins;

        if (currentGuess !== currentSelection) {
          incorrectGuesses += 1;
        } else {
          if (findedGame.player1Role === "coin-player") {
            levelWinner = findedGame.player2;
          } else {
            levelWinner = findedGame.player1;
          }

          break;
        }
      }
    }

    const checkIncorrectGuesses = () => {
      if (incorrectGuesses >= 3) {
        return true;
      }
    };

    if (checkIncorrectGuesses()) {
      if (findedGame.player1Role === "coin-player") {
        levelWinner = findedGame.player1;
      } else {
        levelWinner = findedGame.player2;
      }
    }

    if (levelWinner) {
      if (findedGame.currentLevel === findedGame.levels) {
        const completeGame = await GameSchema.findByIdAndUpdate(
          gameId,
          {
            status: "completed",
            levelWinners: [
              ...findedGame.levelWinners,
              { level: findedGame.currentLevel, winner: levelWinner },
            ],
          },
          { new: true }
        );

        const winnersArr = completeGame.levelWinners.map((winner) =>
          winner.winner?.toString()
        );

        function findMostWinners(arr) {
          const frequency = {}; // Object to store frequency of each string
          let maxCount = 0; // Maximum occurrence count
          let mostFrequent = ""; // String with the highest occurrence

          for (const str of arr) {
            // Count the occurrences of each string
            frequency[str] = (frequency[str] || 0) + 1;

            // Update the most frequent string and max count if needed
            if (frequency[str] > maxCount) {
              maxCount = frequency[str];
              mostFrequent = str;
            }
          }

          return mostFrequent;
        }

        const mostWinsInAGame = findMostWinners(winnersArr);

        const updatedGame = await GameSchema.findByIdAndUpdate(
          gameId,
          {
            winner: new mongoose.Types.ObjectId(mostWinsInAGame),
          },
          { new: true }
        );

        if (findedPlayer1._id.toString() === mostWinsInAGame) {
          await UserSchema.findByIdAndUpdate(findedPlayer1._id, {
            wins: findedPlayer1.wins + 1,
            status: "online",
          });
          await UserSchema.findByIdAndUpdate(findedPlayer2._id, {
            losses: findedPlayer2.losses + 1,
            status: "online",
          });
        } else {
          await UserSchema.findByIdAndUpdate(findedPlayer1._id, {
            losses: findedPlayer1.losses + 1,
            status: "online",
          });
          await UserSchema.findByIdAndUpdate(findedPlayer2._id, {
            wins: findedPlayer2.wins + 1,
            status: "online",
          });
        }

        io.to(gameId).emit("gameCompleted", updatedGame);
      } else {
        const updatedGame = await GameSchema.findByIdAndUpdate(
          gameId,
          {
            currentLevel: findedGame.currentLevel + 1,
            levelWinners: [
              ...findedGame.levelWinners,
              { level: findedGame.currentLevel, winner: levelWinner },
            ],
            currentRound: 1,
          },
          { new: true }
        );
        io.to(gameId).emit("levelCompleted", updatedGame);
      }
    } else {
      const updatedGameForRound = await GameSchema.findByIdAndUpdate(
        gameId,
        {
          currentRound: findedGame.currentRound + 1,
        },
        { new: true }
      );

      io.to(gameId).emit("roundChanged", updatedGameForRound);
    }
  });

  // socket.on("levelCom")

  socket.on("disconnect", async () => {
    const updateUserStatus = await UserSchema.findOneAndUpdate(
      {
        socketId,
      },
      {
        status: "offline",
        socketId: "",
      },
      { new: true }
    );

    console.log("User disconnected");
  });
});

server.listen(5001, () => console.log("Server running on port 5001"));
