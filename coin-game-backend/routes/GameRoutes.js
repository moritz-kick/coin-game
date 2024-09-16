const { Router } = require("express");
const authMiddleware = require("../middlewares");
const GameController = require("../controller/GameController");

const gameRouter = Router();

gameRouter.post("/", authMiddleware, GameController.createGame);
gameRouter.get("/:id", authMiddleware, GameController.getGame);

module.exports = gameRouter;
