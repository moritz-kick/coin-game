const { Router } = require("express");
const UserController = require("../controller/UserController");
const authMiddleware = require("../middlewares");

const userRouter = Router();

userRouter.post("/login", UserController.registerOrLoginUser);
userRouter.get("/", authMiddleware, UserController.getUser);
userRouter.get("/online-users", authMiddleware, UserController.getOnlineUsers);
userRouter.get("/scorecard", UserController.getScorecard);

module.exports = userRouter;
