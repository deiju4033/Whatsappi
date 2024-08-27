// routes/companyUser.routes.js
import express from "express";
import { addCompanyUser } from "../controllers/companyUser.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/add", authenticateUser, addCompanyUser);

export default router;
