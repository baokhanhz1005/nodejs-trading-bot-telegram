import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "../bot/index.js";

export const handler = async (event, context) => {
  const bot = new TelegramBot(APP_CONFIG.TOKEN, { polling: true });

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
    body: "Bot is running.",
  };
};