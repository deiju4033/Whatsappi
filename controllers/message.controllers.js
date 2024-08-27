import CompanyUser from "../models/model.companyUser.js";
import Message from "../models/model.message.js";
import { Op } from "sequelize";

// export const sendMessage = async (req, res) => {
//   try {
//     const { senderId, receiverId, content, mediaURL } = req.body;
//     const message = await Message.create({ senderId, receiverId, content, mediaURL });
//     res.status(201).send({ message });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// };

export const sendMessageToAllCompanyUsers = async (req, res) => {
  try {
    const { companyId, content, mediaURL } = req.body;

    // Get all company users
    const companyUsers = await CompanyUser.findAll({ where: { companyId } });

    const sentMessages = [];

    for (const user of companyUsers) {
      // Create a message record
      const message = await Message.create({
        companyId,
        companyUserId: user.id,
        content,
        mediaURL,
      });

      // Send WhatsApp message
      try {
        await sendWhatsAppMessage(user.phoneNumber, content, mediaURL);
        message.status = 'sent';
        await message.save();
      } catch (error) {
        console.error(`Failed to send WhatsApp message to ${user.phoneNumber}:`, error);
      }

      sentMessages.push(message);
    }

    res.status(200).send({ messages: sentMessages });
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, contactId } = req.params;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId }
        ]
      },
      order: [['timestamp', 'ASC']]
    });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).send({ error: "Message not found" });
    }
    message.status = status;
    await message.save();
    res.send(message);
  } catch (error) {
    res.status(400).send(error);
  }
};