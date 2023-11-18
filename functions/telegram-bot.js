import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "../bot/index.js";
import express from "express";
const app = express();

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

const port = process.env.PORT || 8000;

export const handler = async (event, context) => {
  try {
    app.get("/", (request, response) => {
      response.json({
        message: `Bot is running...`,
      });
    });

    app.listen(port, () => {
      console.log(`App using port ${port}`);
    });

    // const bot = new TelegramBot(APP_CONFIG.TOKEN);
    // if (event.body) {
    //   const body = JSON.parse(event.body);
    //   const chatId = body.message.chat.id;
    //   const command = body.message.text.toLowerCase();
    //   const payload = {
    //     command,
    //     bot,
    //     chatId,
    //   };
    //   handleRunBot(payload);
    // }

    // console.log(event.body);
    // return {
    //   statusCode: 200,
    //   body: "Webhook received!",
    // };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
