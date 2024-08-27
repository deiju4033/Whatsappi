// controllers/whatsapp.controller.js
import { Client } from "whatsapp-web.js";
import qrcode from "qrcode";
import { parsePhoneNumber } from 'libphonenumber-js';
import WhatsAppSession from "../models/model.whatsappSession.js";
import CompanyUser from "../models/model.companyUser.js";

const clients = {};
const qrCodes = {};

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
  const { message } = req.body;

  console.log(`Attempting to send message to all users for user ${userId}`);
  console.log('Message content:', message);

  if (!clients[userId]) {
    console.log(`WhatsApp client for user ${userId} does not exist`);
    return res.status(400).send({ error: "WhatsApp is not initialized" });
  }

  try {
    console.log(`Fetching company users for company ID: ${req.user.companyId}`);
    const companyUsers = await CompanyUser.findAll({ where: { companyId: req.user.companyId } });
    console.log(`Found ${companyUsers.length} company users`);

    if (companyUsers.length === 0) {
      console.log('No company users found');
      return res.status(400).send({ error: "No users found to send messages to" });
    }

    const results = await Promise.all(companyUsers.map(async (user) => {
      try {
        console.log(`Processing user: ${user.id}, Phone number: ${user.phoneNumber}`);
        const formattedNumber = formatPhoneNumber(user.phoneNumber);
        console.log(`Formatted number: ${formattedNumber}`);
        
        console.log(`Sending message to ${formattedNumber}@c.us`);
        await clients[userId].sendMessage(`${formattedNumber}@c.us`, message);
        console.log(`Message sent successfully to ${formattedNumber}`);
        
        return { phoneNumber: user.phoneNumber, status: "sent" };
      } catch (error) {
        console.error(`Error sending message to ${user.phoneNumber}:`, error);
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

export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { phoneNumber, message } = req.body;

  if (!clients[userId] || !clients[userId].isReady) {
    return res.status(400).send({ error: "WhatsApp is not connected" });
  }

  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    await clients[userId].sendMessage(`${formattedNumber}@c.us`, message);
    res.status(200).send({ status: "sent", phoneNumber });
  } catch (error) {
    console.error(`Error sending message to ${phoneNumber}:`, error);
    res.status(500).send({ status: "failed", phoneNumber, error: error.message });
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