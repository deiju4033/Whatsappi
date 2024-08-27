import express from "express";
import { addContact, getContacts, updateContact, deleteContact } from "../controllers/contact.controllers.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/addContact",addContact);
router.get("/getContacts/:userId",getContacts);
router.put("/update/:id", updateContact);
router.delete("/:id", authenticateUser, deleteContact);

export default router;