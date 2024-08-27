import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 120000,
    headless: true,
  },
});

let clientReady = false;

client.on("ready", () => {
  clientReady = true;
  console.log("WhatsApp Client is ready!");
});

const waitForClient = () => {
  return new Promise((resolve) => {
    if (clientReady) resolve();
    else {
      client.on("ready", resolve);
    }
  });
};

const formatPhoneNumber = (number) => {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("965") || digits.startsWith("91")) {
    return digits;
  }
  if (digits.length === 10) {
    return "91" + digits;
  }
  return digits;
};

const sendMessage = async (number, message) => {
  await waitForClient();
  const formattedNumber = formatPhoneNumber(number);
  console.log(`Attempting to send message to: ${formattedNumber}`);
  try {
    const result = await client.sendMessage(`${formattedNumber}@c.us`, message);
    console.log(`Message sent successfully: ${result}`);
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export { client, sendMessage };
