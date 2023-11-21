import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "../bot/index.js";
import TelegramBot from "node-telegram-bot-api";

export const handler = async (event, context) => {
  try {
    // Set up Telegram bot with webhook
    const bot = new TelegramBot(APP_CONFIG.TOKEN);
    console.log(event);
    if (event && event.body) {
      const { message } = JSON.parse(event.body);
      

      const chatId = message.chat.id;
      const command = message.text.toLowerCase();
      bot.sendMessage(chatId, command);
        // const payload = {
        //   command,
        //   bot,
        //   chatId,
        // };
        // await handleRunBot(payload);
      
    }

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
