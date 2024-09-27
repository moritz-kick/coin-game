const GameSchema = require("../models/GameSchema");
const User = require("../models/UserSchema");
const jwt = require("jsonwebtoken");

const registerOrLoginUser = async (req, res) => {
  try {
    const { username, deviceId } = req.body;

    let user = await User.findOne({
      deviceId,
    });

    if (!user) {
      user = new User({
        username,
        deviceId,
      });
      await user.save();
    } else {
      // Update username if it has changed
      if (user.username !== username) {
        user.username = username;
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      token,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};


const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ status: "online" }, { status: "in-game" }],
      _id: { $ne: req.user.id },
    });
    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getScorecard = async (req, res) => {
  try {
    if (req.query.type === "all") {
      const users = await User.find({}).sort({ wins: -1 });

      const mappedUsers = users.map((user) => ({
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        winRate: (user.wins / (user.wins + user.losses)) * 100,
        id: user._id.toString(),
      }));

      res.status(200).json({
        users: mappedUsers,
      });
    } else {
      const users = await User.find();

      // Fetch all games
      const games = await GameSchema.find();

      // Initialize maps to store wins and losses for coin-players and estimators
      const coinPlayerStats = {};
      const estimatorStats = {};

      // Process each game to determine roles and update stats
      games.forEach((game) => {
        const { player1, player2, player1Role, player2Role, winner } = game;

        // Update stats for player1
        if (player1Role === "coin-player") {
          if (!coinPlayerStats[player1]) {
            coinPlayerStats[player1] = { wins: 0, losses: 0 };
          }
          if (winner && winner.toString() === player1.toString()) {
            coinPlayerStats[player1].wins += 1;
          } else {
            coinPlayerStats[player1].losses += 1;
          }
        } else {
          if (!estimatorStats[player1]) {
            estimatorStats[player1] = { wins: 0, losses: 0 };
          }
          if (winner && winner.toString() === player1.toString()) {
            estimatorStats[player1].wins += 1;
          } else {
            estimatorStats[player1].losses += 1;
          }
        }

        // Update stats for player2
        if (player2Role === "coin-player") {
          if (!coinPlayerStats[player2]) {
            coinPlayerStats[player2] = { wins: 0, losses: 0 };
          }
          if (winner && winner.toString() === player2.toString()) {
            coinPlayerStats[player2].wins += 1;
          } else {
            coinPlayerStats[player2].losses += 1;
          }
        } else {
          if (!estimatorStats[player2]) {
            estimatorStats[player2] = { wins: 0, losses: 0 };
          }
          if (winner && winner.toString() === player2.toString()) {
            estimatorStats[player2].wins += 1;
          } else {
            estimatorStats[player2].losses += 1;
          }
        }
      });

      // Calculate win rate and prepare the scoreboard data
      const coinPlayers = [];
      const estimators = [];

      users.forEach((user) => {
        const userId = user._id.toString();
        if (coinPlayerStats[userId]) {
          const { wins, losses } = coinPlayerStats[userId];
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
          coinPlayers.push({
            id: userId,
            username: user.username,
            wins,
            losses,
            winRate,
          });
        }
        if (estimatorStats[userId]) {
          const { wins, losses } = estimatorStats[userId];
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
          estimators.push({
            id: userId,
            username: user.username,
            wins,
            losses,
            winRate,
          });
        }
      });

      // Sort users by win rate in descending order
      coinPlayers.sort((a, b) => b.winRate - a.winRate);
      estimators.sort((a, b) => b.winRate - a.winRate);

      if (req.query.type === "coin-players") {
        res.status(200).json({
          users: coinPlayers,
        });
      } else {
        res.status(200).json({
          users: estimators,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  registerOrLoginUser,
  getOnlineUsers,
  getUser,
  getScorecard,
};
