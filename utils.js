import ExchangeInfoService from "./services/ExchangeInfo.js";
import GetCandleService from "./services/GetCandle.js";

export const timeToSpecificTime = (gapTime = 60, delay = 0) => {
  const now = new Date();
  let time = gapTime;

  if (gapTime !== 60) {
    time = 60;
  }
  console.log(time);
  const minutesUntilNextHour = time - now.getMinutes() + delay;
  const secondsUntilNextHour = minutesUntilNextHour * 60;
  return secondsUntilNextHour * 1000;
};

export const calculateTimeout15m = (delay = 0) => {
  const currentDate = new Date();
  const currentMinutes = currentDate.getMinutes();

  let targetMinutes;

  if (currentMinutes < 15) {
      targetMinutes = 15;
  } else if (currentMinutes < 30) {
      targetMinutes = 30;
  } else if (currentMinutes < 45) {
      targetMinutes = 45;
  } else {
      targetMinutes = 60;
  }

  const timeToTarget = targetMinutes - currentMinutes + delay;
  const timeout = timeToTarget * 60 * 1000;
  return timeout;
}

export function sendCurrentTime(bot, chatId) {
  const currentTime = new Date().toLocaleTimeString();
  bot.sendMessage(chatId, `>>>>>>>>>>><<<<<<<<<<`);
  bot.sendMessage(chatId, `BOT đang tracking dữ liệu vào: ${currentTime}`);
}

export const fetchApiGetListingSymbols = async () => {
  let listSymbols = [];
  const response = await ExchangeInfoService.info();
  if (response && response.data) {
    listSymbols = response.data.symbols.map((pair) => {
      if (pair.quoteAsset === "USDT" && pair.symbol) {
        return {
          symbol: pair.symbol,
          stickPrice: pair.pricePrecision
        };
      }
    });
  }

  return listSymbols.filter(Boolean);
};

export const fetchApiGetCandleStickData = async (params) => {
  try {
    const { symbol } = params.data;
    const response = await GetCandleService.getList(params);

    if (response) {
      return { data: response.data, symbol };
    }
    return {};
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    throw error;
  }
};

export const fetchApiGetCurrentPrice = async (params) => {
  try {
    const response = await GetCandleService.getCurrent(params);

    if (response) {
      return response.data;
    }
    return {};
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    throw error;
  }
};

export const buildLinkToSymbol = (symbol) => {
  const linkUrl = `https://www.tradingview.com/chart/hyWIwHCK/?symbol=BINANCE%3A${symbol}.P`;
  const url = `<a href="${linkUrl}" target="_blank">${symbol}</a>`;
  return url;
};
