import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "./constant.js";
import { handleRunBot } from "./bot/index.js";
import express from "express";

const app = express();
app.get("/", (req, res) => {
  res.json({ message: "Bot is running..." });
});

const port = process.env.port || 8088;
app.listen(port, () => {
  console.log("Bot is running");
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
