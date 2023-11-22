import bot from "../utils/SendMessage.js";
import { handleRunBot } from "../bot/index.js";
import { APP_CONFIG } from "../constant.js";

export const handler = async (event, context) => {
  try {
    if (event && event.body) {
      const { message } = JSON.parse(event.body);

      const chatId = message.chat.id;
      const command = message.text.toLowerCase();
      const payload = {
        command,
        bot,
        chatId,
      };
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
