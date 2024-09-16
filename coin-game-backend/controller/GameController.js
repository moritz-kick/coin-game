const GameSchema = require("../models/GameSchema");
const UserSchema = require("../models/UserSchema");

const createGame = async (req, res) => {
  try {
    const player1Id = req.user.id;
    const player2Id = req.params.id;

    const findedPlayer2 = await UserSchema.findById(player2Id);

    if (!findedPlayer2) {
      throw new Error("Player 2 not found");
    }

    const game = GameSchema.create({
      player1: player1Id,
      player2: player2Id,
      player1Role:
        req?.user?.createdAt < findedPlayer2?.createdAt
          ? "coin-player"
          : "estimator",
      player2Role:
        req?.user?.createdAt < findedPlayer2?.createdAt
          ? "estimator"
          : "coin-player",
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
    const game = await GameSchema.findById(req.params.id);

    res.status(200).json({
      game,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  createGame,
  getGame,
};
