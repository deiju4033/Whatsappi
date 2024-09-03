import express from "express";
import {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany, // Import the deleteCompany controller
} from "../controllers/company.controllers.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/createCompany", createCompany);
router.get("/getAllCompanies", getCompanies);
router.get("/getCompany/:id", getCompany);
router.put("/updateCompany/:id", updateCompany);
router.delete("/deleteCompany/:id", deleteCompany);
export default router;
