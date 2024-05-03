import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "./handlers/index.js";

const bot = new TelegramBot(APP_CONFIG.TOKEN, { polling: true });

let isBotRunning = false;

// Khởi tạo bot chỉ chạy khi chưa có bot nào chạy
if (!isBotRunning) {
  isBotRunning = true;

  process.on("uncaughtException", (e) => {
    console.error(`Something went wrong ${e}`);
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const command = msg.text ? msg.text.toLowerCase() : "";
    const payload = {
      command,
      bot,
      chatId,
    };
    handleRunBot(payload);
  });
} else {
  console.log("Bot is already running.");
}
