import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

const clients = {};

export const getWhatsAppClient = (companyId) => {
  if (!clients[companyId]) {
    clients[companyId] = new Client({
      authStrategy: new LocalAuth({ clientId: `company-${companyId}` }),
      puppeteer: {
        args: ["--no-sandbox"],
      },
    });

    clients[companyId].on("qr", (qr) => {
      console.log(`QR code for company ${companyId}:`, qr);
      clients[companyId].qrCode = qr;
    });

    clients[companyId].on("ready", () => {
      console.log(`WhatsApp client for company ${companyId} is ready`);
      clients[companyId].isReady = true;
    });

    clients[companyId].initialize().catch((err) => {
      console.error(`Error initializing client for company ${companyId}:`, err);
    });
  }
  return clients[companyId];
};

export const isClientAuthenticated = async (client) => {
  if (!client.isReady) {
    return false;
  }
  try {
    const state = await client.getState();
    return state === "CONNECTED";
  } catch (error) {
    console.error("Error checking authentication state:", error);
    return false;
  }
};

// export const sendWhatsAppMessage = async (phoneNumber, content, mediaURL) => {
//   const client = getWhatsAppClient(); 

//   try {
//     if (mediaURL) {
//       await client.sendMessage(`${phoneNumber}@c.us`, { url: mediaURL });
//     }
//     await client.sendMessage(`${phoneNumber}@c.us`, content);
//   } catch (error) {
//     console.error(`Error sending WhatsApp message to ${phoneNumber}:`, error);
//     throw error;
//   }
// };
