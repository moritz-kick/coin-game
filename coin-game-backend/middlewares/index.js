const UserSchema = require("../models/UserSchema");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserSchema.findOne({
      _id: decoded.id,
    });
    if (!user) {
      throw new Error("User Not Found");
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({
      error: "Please authenticate",
    });
  }
};

module.exports = authMiddleware;
