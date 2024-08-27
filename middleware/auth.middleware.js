import User from "../models/model.user.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const username = req.header("X-Username");
    const password = req.header("X-Password");
    const token = req.header("X-Token");

    if (!username || !password || !token) {
      throw new Error("Authentication failed: Missing credentials");
    }

    const user = await User.findOne({ where: { username } });

    if (!user || user.password !== password || user.token !== token) {
      throw new Error("Authentication failed: Invalid credentials");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
};