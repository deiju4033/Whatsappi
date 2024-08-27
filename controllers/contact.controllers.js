import Contact from "../models/model.contacts.js";
import User from "../models/model.user.js";

export const addContact = async (req, res) => {
  try {
    const { userId, contactUserId, nickname } = req.body;
    
    const user = await User.findByPk(userId);
    const contactUser = await User.findByPk(contactUserId);

    if (!user || !contactUser) {
      return res.status(404).send({ error: "User or contact not found" });
    }

    const contact = await Contact.create({ userId, contactUserId, nickname });
    res.status(201).send({ contact });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getContacts = async (req, res) => {
  try {
    const { userId } = req.params;
    const contacts = await Contact.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'contactUser',
          attributes: ['id', 'username', 'phoneNumber', 'profilePicture', 'status']
        }
      ]
    });
    res.send(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred while fetching contacts." });
  }
};


export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, blocked } = req.body;
    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).send({ error: "Contact not found" });
    }
    contact.nickname = nickname !== undefined ? nickname : contact.nickname;
    contact.blocked = blocked !== undefined ? blocked : contact.blocked;
    await contact.save();
    res.send(contact);
  } catch (error) {
    res.status(400).send(error);
  }
};


export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).send({ error: "Contact not found" });
    }
    await contact.destroy();
    res.send({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
};