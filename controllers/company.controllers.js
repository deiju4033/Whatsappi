import Company from "../models/model.company.js";

export const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    const company = await Company.create({ name });
    res.status(201).send({ company });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.send(companies);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).send({ error: "Company not found" });
    }
    res.send(company);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).send({ error: "Company not found" });
    }
    company.name = name;
    await company.save();
    res.send(company);
  } catch (error) {
    res.status(400).send(error);
  }
};