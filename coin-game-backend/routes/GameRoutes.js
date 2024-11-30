const { Router } = require("express");
const authMiddleware = require("../middlewares");
const GameController = require("../controller/GameController");

const gameRouter = Router();

// Route to create a multiplayer game
gameRouter.post("/", authMiddleware, GameController.createGame);

// **New Route: Create AI Game**
gameRouter.post("/create-ai-game", authMiddleware, GameController.createAIGame);

// Route to get a game by ID
gameRouter.get("/:id", authMiddleware, GameController.getGame);

module.exports = gameRouter;
