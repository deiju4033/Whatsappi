import express from "express";
import {  getMessages, updateMessageStatus,sendMessageToAllCompanyUsers } from "../controllers/message.controllers.js";
import { authenticateUser } from "../middleware/auth.middleware.js";


const router = express.Router();

// router.post("/", authenticateUser, sendMessage);
router.get("/:userId/:contactId", authenticateUser, getMessages);
router.put("/:id/status", authenticateUser, updateMessageStatus);
// router.post("/send-to-all",  sendMessageToAllCompanyUsers);


export default router;