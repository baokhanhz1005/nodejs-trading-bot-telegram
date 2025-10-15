import TelegramBot from "node-telegram-bot-api";
import { APP_CONFIG } from "../constant.js";
import { handleRunBot } from "./handlers/index.js";
import storage from "node-persist";

const bot = new TelegramBot(APP_CONFIG.TOKEN_TEST, { polling: true });

let isBotRunning = false;
let dataCandleAPI = null;

const isCacheDataCandle = false;

const GLOBAL_KEY = "TEST_1";

const loadData = async () => {
  const data = await storage.getItem(GLOBAL_KEY);
  if (data) {
    dataCandleAPI = data;
  }
};

const handleSaveData = async (data) => {
  await storage.setItem(GLOBAL_KEY, data);
};

await storage.init();

if (isCacheDataCandle) {
  await loadData();
}

// clear cache data
process.on("SIGINT", async () => {
  await storage.clear();

  console.log("End process.....");
  process.exit();
});

// Khởi tạo bot chỉ chạy khi chưa có bot nào chạy
if (!isBotRunning) {
  isBotRunning = true;

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const command = msg.text ? msg.text.toLowerCase() : "";
    const payload = {
      command,
      bot,
      chatId,
      dataCandleAPI,
      updateDataCandleAPI: (data) => handleSaveData(data),
    };

    if (command) {
      handleRunBot(payload);
    }
  });

  // Hàm xử lý callback query
  const handleCallbackQuery = async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const command = query.data + " isCheckCurrentOrder";

    const payload = {
      command,
      bot,
      chatId,
      dataCandleAPI,
      updateDataCandleAPI: (data) => handleSaveData(data),
    };

    if (command) {
      handleRunBot(payload);
    }
  };

  // Xóa listener cũ trước khi thêm mới
  bot.removeListener("callback_query", handleCallbackQuery);
  bot.on("callback_query", handleCallbackQuery);
} else {
  console.log("Bot is already running.");
}
