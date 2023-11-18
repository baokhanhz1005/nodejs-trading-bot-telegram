import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "../bot/index.js";

export const handler = async (event, context) => {
  try {
    // Set up Telegram bot with webhook
    const bot = new TelegramBot(APP_CONFIG.TOKEN);
    const webhookURL = "https://main--helpful-torrone-1696a9.netlify.app/.netlify/functions/telegram-bot";

    // Set the webhook
    bot.setWebHook(webhookURL);

    // Handle incoming messages
    bot.on("message", async (msg) => {
      const chatId = msg.chat.id;
      const command = msg.text.toLowerCase();
      const payload = {
        command,
        bot,
        chatId,
      };
      handleRunBot(payload);
    });

    return {
      statusCode: 200,
      body: "Function is running...",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
