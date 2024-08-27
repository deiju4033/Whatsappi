import express from "express";
import {
  createUser,
  getCompanyForUser,
  loginUser,
} from "../controllers/user.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);

router.get("/protected", authenticateUser, (req, res) => {
  res.send({
    message: "This is a protected route",
    user: req.user,
    link: `https://wa.amiyon.com/whatsapp?username=${req.user.username}&password=${req.headers["x-password"]}&token=${req.headers["x-token"]}`,
  });
});

router.get("/company/:username", getCompanyForUser);

export default router;