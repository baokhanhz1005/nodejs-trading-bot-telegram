import bot from "../utils/SendMessage.js";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "./handlers/index.js";

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
      body: JSON.stringify(event.body),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
