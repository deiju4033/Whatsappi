// controllers/companyUser.controller.js
import CompanyUser from "../models/model.companyUser.js";
import Company from "../models/model.company.js";

export const addCompanyUser = async (req, res) => {
  try {
    const { companyId, name, phoneNumber } = req.body;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ error: "Company not found" });
    }
    const newUser = await CompanyUser.create({
      companyId,
      name,
      phoneNumber,
    });

    res.status(201).json({ message: "Company user added successfully", newUser });
  } catch (error) {
    console.error("Error adding company user:", error);
    res.status(500).json({ error: "Failed to add company user" });
  }
};
