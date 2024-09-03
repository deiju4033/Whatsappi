import CompanyUser from "../models/model.companyUser.js";
import Company from "../models/model.company.js";
import xlsx from 'xlsx';

export const addContact = async (req, res) => {
  try {
    const { name, phoneNumber, nickname, companyId } = req.body;
    
    if (!name || !phoneNumber || !companyId) {
      return res.status(400).json({ error: "Name, phone number, and company ID are required" });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const newContact = await CompanyUser.create({
      name,
      phoneNumber,
      nickname,
      companyId,
    });

    res.status(201).json({ contact: newContact });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ error: "Failed to add contact", details: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await CompanyUser.findByPk(id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await contact.destroy();
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact", details: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, nickname, blocked } = req.body;
    
    const contact = await CompanyUser.findByPk(id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (name) contact.name = name;
    if (phoneNumber) contact.phoneNumber = phoneNumber;
    if (nickname !== undefined) contact.nickname = nickname;
    if (blocked !== undefined) contact.blocked = blocked;

    await contact.save();
    res.json({ contact });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact", details: error.message });
  }
};

export const getContacts = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const contacts = await CompanyUser.findAll({
      where: { companyId },
      order: [['name', 'ASC']],
    });

    res.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts", details: error.message });
  }
};

export const uploadContacts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const createdContacts = [];
    const errors = [];

    for (const row of data) {
      try {
        if (!row.name || !row.phoneNumber) {
          throw new Error("Name and phone number are required");
        }

        const newContact = await CompanyUser.create({
          name: row.name,
          phoneNumber: row.phoneNumber,
          nickname: row.nickname || null,
          companyId: companyId
        });

        createdContacts.push(newContact);
      } catch (error) {
        errors.push(`Error adding contact ${row.name}: ${error.message}`);
      }
    }

    res.status(201).json({
      message: "Contacts upload completed",
      createdContacts: createdContacts.length,
      errors: errors
    });
  } catch (error) {
    console.error("Error uploading contacts:", error);
    res.status(500).json({ error: "Failed to upload contacts", details: error.message });
  }
};

