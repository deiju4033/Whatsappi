import express from "express";
import { sendMessages } from "../controllers/notification.controllers.js";

const router = express.Router();

router.post("/send-messages", sendMessages);

export default router;
