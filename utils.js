import ExchangeInfoService from "./services/ExchangeInfo.js";
import GetCandleService from "./services/GetCandle.js";

export const timeUntilNextHour = () => {
  const now = new Date();
  const minutesUntilNextHour = 60 - now.getMinutes() + 5;
  const secondsUntilNextHour = minutesUntilNextHour * 60;
  return secondsUntilNextHour * 1000;
};

export function sendCurrentTime(bot, chatId) {
  const currentTime = new Date().toLocaleTimeString();
  bot.sendMessage(chatId, `================================================`);
  bot.sendMessage(chatId, `BOT đang tracking dữ liệu vào: ${currentTime}`);
}

export const fetchApiGetListingSymbols = async () => {
  const response = await ExchangeInfoService.info();
  const listSymbols = response.data.symbols.map((pair) => {
    if (pair.quoteAsset === "USDT") {
      return pair.symbol;
    }
  });

  return listSymbols;
};

export const fetchApiGetCandleStickData = async (params) => {
  try {
    const response = await GetCandleService.getList(params);

    if (response) {
      return response.data;
    }
    return {};
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    throw error;
  }
};

export const buildLinkToSymbol = symbol => {
  const linkUrl = `https://www.tradingview.com/chart/biGlEz3q/?symbol=BINANCE%3A${symbol}`
  const url = `<a href="${linkUrl}" target="_blank">${symbol}</a>`;
  return url
}