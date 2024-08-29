import pkg from "whatsapp-web.js";
const { Client, MessageMedia } = pkg;
import qrcode from "qrcode";
import { parsePhoneNumber } from 'libphonenumber-js';
import WhatsAppSession from "../models/model.whatsappSession.js";
import CompanyUser from "../models/model.companyUser.js";
import Message from "../models/model.message.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const clients = {};
const qrCodes = {};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './whatsapp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const formatPhoneNumber = (number, defaultCountry = 'IN') => {
  try {
    const phoneNumber = parsePhoneNumber(number, defaultCountry);
    if (phoneNumber.isValid()) {
      return phoneNumber.format('E.164').slice(1);
    } else {
      throw new Error('Invalid phone number');
    }
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return number;
  }
};

export const getQRCode = async (req, res) => {
  const userId = req.user.id;
  let qrSent = false;

  if (clients[userId] && clients[userId].isReady) {
    return res.status(200).send({ message: "WhatsApp is already connected" });
  }

  if (qrCodes[userId]) {
    return res.status(200).send({ qrImageUrl: qrCodes[userId] });
  }

  if (!clients[userId]) {
    clients[userId] = new Client({
      puppeteer: { headless: true },
      session: null
    });

    clients[userId].on("qr", async (qr) => {
      try {
        if (!qrSent) {
          const qrImageUrl = await qrcode.toDataURL(qr);
          qrCodes[userId] = qrImageUrl;
          res.status(200).send({ qrImageUrl });
          qrSent = true;
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
        if (!qrSent) {
          res.status(500).send({ error: "Failed to generate QR code" });
          qrSent = true;
        }
      }
    });

    clients[userId].on("ready", async () => {
      clients[userId].isReady = true;
      const session = await clients[userId].pupPage.evaluate(() => {
        return localStorage.getItem('WABrowserId');
      });
      await WhatsAppSession.upsert({
        userId,
        sessionData: session,
        isActive: true
      });
      delete qrCodes[userId];
    });

    clients[userId].initialize().catch((err) => {
      console.error("Error initializing WhatsApp client:", err);
      if (!qrSent) {
        res.status(500).send({ error: "Failed to initialize WhatsApp client" });
        qrSent = true;
      }
    });
  }

  setTimeout(() => {
    if (!qrSent) {
      res.status(408).send({ error: "Timeout while waiting for QR code" });
    }
  }, 30000);
};

export const checkStatus = async (req, res) => {
  const userId = req.user.id;
  const session = await WhatsAppSession.findOne({ where: { userId } });

  console.log('Checking WhatsApp status for user:', userId);

  if (clients[userId] && clients[userId].isReady) {
    console.log('Client is ready');
    res.status(200).send({ status: "connected" });
  } else if (qrCodes[userId]) {
    console.log('QR code is ready');
    res.status(200).send({ status: "qr_ready", qrImageUrl: qrCodes[userId] });
  } else if (session && session.isActive) {
    console.log('Session exists');
    if (!clients[userId]) {
      console.log('Initializing client with existing session');
      clients[userId] = new Client({
        puppeteer: { headless: true },
        session: session.sessionData
      });

      clients[userId].on("ready", () => {
        console.log(`WhatsApp client for user ${userId} is ready`);
        clients[userId].isReady = true;
      });

      clients[userId].on("auth_failure", async () => {
        console.log(`Authentication failed for user ${userId}`);
        await WhatsAppSession.update({ isActive: false }, { where: { userId } });
        delete clients[userId];
      });

      await clients[userId].initialize();
      console.log(`Client initialized for user ${userId}`);
    }
    res.status(200).send({ status: "session_exists" });
  } else {
    console.log('Disconnected');
    res.status(200).send({ status: "disconnected" });
  }
};

export const sendMessageToAll = async (req, res) => {
  const userId = req.user.id;
  const { messageType, content } = req.body;
  const file = req.file;

  console.log(`Attempting to send ${messageType} message to all users for user ${userId}`);
  console.log('Message content:', content);
  console.log('File:', file);

  if (!clients[userId] || !clients[userId].isReady) {
    console.log(`WhatsApp client for user ${userId} is not ready`);
    return res.status(400).send({ error: "WhatsApp is not initialized or not ready" });
  }

  try {
    console.log(`Fetching company users for company ID: ${req.user.companyId}`);
    const companyUsers = await CompanyUser.findAll({ where: { companyId: req.user.companyId } });
    console.log(`Found ${companyUsers.length} company users`);

    if (companyUsers.length === 0) {
      console.log('No company users found');
      return res.status(400).send({ error: "No users found to send messages to" });
    }

    let media;
    if (messageType !== 'text' && file) {
      try {
        console.log(`Loading media from path: ${file.path}`);
        const fileData = fs.readFileSync(file.path);
        const fileBase64 = fileData.toString('base64');
        media = new MessageMedia(file.mimetype, fileBase64, file.filename);
        console.log('Media loaded successfully');
      } catch (error) {
        console.error('Error loading media:', error);
        return res.status(400).send({ error: "Failed to load media", details: error.message });
      }
    }

    const results = await Promise.all(companyUsers.map(async (user) => {
      try {
        console.log(`Processing user: ${user.id}, Phone number: ${user.phoneNumber}`);
        const formattedNumber = formatPhoneNumber(user.phoneNumber);
        console.log(`Formatted number: ${formattedNumber}`);

        let sentMessage;
        try {
          switch (messageType) {
            case 'text':
              sentMessage = await clients[userId].sendMessage(`${formattedNumber}@c.us`, content);
              break;
            case 'image':
            case 'video':
            case 'document':
              console.log(`Sending ${messageType} to ${formattedNumber}`);
              sentMessage = await clients[userId].sendMessage(`${formattedNumber}@c.us`, media, { caption: content });
              break;
            default:
              throw new Error('Invalid message type');
          }
        } catch (error) {
          console.error('Detailed error:', error);
          if (file) {
            console.error('Media file details:', {
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype
            });
          }
          throw error;
        }

        console.log(`Message sent successfully to ${formattedNumber}`);

        // Store the message in the database
        console.log('Attempting to store message in database');
        try {
          const createdMessage = await Message.create({
            companyId: req.user.companyId,
            companyUserId: user.id,
            content: content,
            mediaType: messageType === 'text' ? 'none' : messageType,
            mediaURL: file ? file.path : null,
            status: 'sent',
            timestamp: new Date()
          });
          console.log('Message stored successfully:', createdMessage.toJSON());
        } catch (error) {
          console.error('Error storing message in database:', error);
          throw error; // Rethrow the error to be caught in the outer catch block
        }

        return { phoneNumber: user.phoneNumber, status: "sent" };
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        return { phoneNumber: user.phoneNumber, status: "failed", error: error.message };
      }
    }));

    console.log('All messages processed. Results:', results);

    const successCount = results.filter(r => r.status === "sent").length;
    const failureCount = results.filter(r => r.status === "failed").length;

    res.status(200).send({ 
      results,
      summary: {
        total: results.length,
        sent: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Error in sendMessageToAll:', error);
    res.status(500).send({ error: "Internal server error", details: error.message });
  }
};

export const getPreviousChats = async (req, res) => {
  const { companyUserId } = req.params;
  const companyId = req.user.companyId;

  console.log(`Fetching chats for companyId: ${companyId}, companyUserId: ${companyUserId}`);

  try {
    const messages = await Message.findAll({
      where: { companyId, companyUserId },
      order: [['timestamp', 'DESC']],
      limit: 100 
    });

    console.log(`Found ${messages.length} messages`);
    if (messages.length > 0) {
      console.log('First message:', messages[0].toJSON());
    } else {
      console.log('No messages found');
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching previous chats:', error);
    res.status(500).json({ error: 'Failed to fetch previous chats' });
  }
};



export const disconnect = async (req, res) => {
  const userId = req.user.id;

  if (clients[userId]) {
    try {
      await clients[userId].destroy();
      delete clients[userId];
      delete qrCodes[userId];

      await WhatsAppSession.update({ isActive: false }, { where: { userId } });

      res.status(200).send({ message: "WhatsApp disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      res.status(500).send({ error: "Failed to disconnect WhatsApp" });
    }
  } else {
    res.status(400).send({ message: "No active WhatsApp connection" });
  }
};

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = './whatsapp';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  })
}).single('file'); 