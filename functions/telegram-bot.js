import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "../bot/index.js";
import bot from "../SendMessage.js";

export const handler = async (event, context) => {
  try {
    // Set up Telegram bot with webhook
    // const bot = new TelegramBot(APP_CONFIG.TOKEN);
    if (event && event.body) {
      const { message } = JSON.parse(event.body);

      const chatId = message.chat.id;
      const command = message.text.toLowerCase();
      const payload = {
        command,
        bot,
        chatId,
      };
      await bot.sendMessage(chatId, 'hahâhahahaha');
      await handleRunBot(payload);
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
