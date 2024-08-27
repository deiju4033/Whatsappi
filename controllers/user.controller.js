import User from "../models/model.user.js";
import Company from "../models/model.company.js";
import crypto from "crypto";

export const createUser = async (req, res) => {
  try {
    const { phoneNumber, username, password, companyId } = req.body;

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).send({ error: "Company not found" });
    }

    const existingUser = await User.findOne({ where: { companyId } });
    if (existingUser) {
      return res.status(400).send({ error: "This company already has a user" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    const user = await User.create({
      phoneNumber,
      username,
      password,
      token,
      companyId,
    });

    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ where: { phoneNumber } });

    if (!user || user.password !== password) {
      throw new Error("Invalid login credentials");
    }

    res.send({ user, token: user.token });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getCompanyForUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const company = await Company.findByPk(user.companyId);

    if (!company) {
      return res.status(404).send({ error: "Company not found" });
    }

    res.send(company);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { profilePicture, status } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    user.profilePicture = profilePicture || user.profilePicture;
    user.status = status || user.status;
    user.lastSeen = new Date();

    await user.save();

    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};