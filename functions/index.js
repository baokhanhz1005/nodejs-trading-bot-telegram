// functions/myFunction.js
import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "./constant.js";
import ExchangeInfoService from "./services/ExchangeInfo.js";
import { sendCurrentTime, timeUntilNextHour } from "./utils.js";
import { handleRunBot } from "./bot/index.js";
import express from "express";
import serverless from 'serverless-http';
const app = express();
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const port = process.env.PORT || 8000;

app.get("/", (request, response) => {
  response.json({
    message: `Bot đang chay...`,
  });

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
});

app.listen(port, () => {
  console.log(`App using port ${port}`);
});

export const handler = serverless(app);