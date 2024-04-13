import fs from "fs/promises";
import path from "path";
import util from "util";
import ExchangeInfoService from "./services/ExchangeInfo.js";
import GetCandleService from "./services/GetCandle.js";
import OrderServices from "./services/Order.js";
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
};

export function sendCurrentTime(bot, chatId) {
  const currentTime = new Date().toLocaleTimeString();
  bot.sendMessage(chatId, `🧐🧐🧐🧐🧐🧐🧐🧐🧐`);
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
          stickPrice: pair.pricePrecision,
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

export const buildLinkToSymbol = (symbol, timeStamp) => {
  const linkUrl = `https://en.tradingview.com/chart/?symbol=BINANCE%3A${symbol}.P&timestamp=${timeStamp}`;
  const url = `<a href="${linkUrl}" target="_blank">${symbol}</a>`;
  return url;
};

export const fetchApiGetCurrentPositionAccount = async () => {
  try {
    let result = [];
    const params = {
      data: {
        timestamp: Date.now(),
      },
    };
    const res = await OrderServices.getListPosition(params);

    if (res && res.data) {
      result = res.data.filter((pos) => !!parseFloat(pos.entryPrice));
    }
    return result;
  } catch (e) {
    console.log(e);
  }
};

export const checking = async (data) => {
  // dùng để trace data tại file VIEW_DATA cho việc debug
  const fileName = "VIEW_DATA.json";
  const filePath = path.join(".", fileName);
  const writeFile = util.promisify(fs.writeFile);

  await writeFile(filePath, JSON.stringify(data, null, 2));
};

// Tính RSI từ dữ liệu nến
export function calculateRSI(data, period) {
  const changes = data.map((price, index) => {
    let value = 100;
    if (index > 0) {
      if (isNaN(parseFloat(price[4]) - parseFloat(data[index - 1][4]))) {
        console.log(parseFloat(price[4]), parseFloat(data[index - 1][4]));
        console.log(index);
      }
      value = parseFloat(price[4]) - parseFloat(data[index - 1][4]);
    }
    return value;
  });

  // console.log(changes);
  const gains = changes.map((change) => (change > 0 ? change : 0));
  const losses = changes.map((change) => (change < 0 ? Math.abs(change) : 0));

  const averageGain = calculateAverage(gains.slice(0, period));
  const averageLoss = calculateAverage(losses.slice(0, period));

  // // Kiểm tra để tránh chia cho 0
  // if (averageLoss === 0) {
  //   return 100; // Hoặc giá trị khác tùy thuộc vào yêu cầu của bạn
  // }

  const rs = averageGain / averageLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

// Tính Stochastic RSI từ RSI
export function calculateStochRSI(rsi, kPeriod, dPeriod) {
  const stochRSI = [];

  for (let i = dPeriod; i < rsi.length; i++) {
    const slice = rsi.slice(i - dPeriod, i);

    // Kiểm tra xem slice có chứa giá trị NaN không
    if (slice.includes(NaN)) {
      stochRSI.push(NaN); // Nếu có giá trị NaN trong slice, thì push NaN vào stochRSI
    } else {
      // Kiểm tra xem có phép chia cho 0 không
      const range = Math.max(...slice) - Math.min(...slice);
      const kValue = range !== 0 ? (rsi[i] - Math.min(...slice)) / range : 0;

      stochRSI.push(kValue * 100);
    }
  }

  return stochRSI;
}

// Tính Moving Average từ dữ liệu
export function calculateMovingAverage(data, period) {
  const ma = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const average = slice.reduce((sum, value) => sum + value, 0) / period;
    ma.push(average);
  }

  return ma;
}

// Hàm tính trung bình cộng
function calculateAverage(values) {
  // console.log("valueeee", values);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export const buildTimeStampToDate = (timestamp) => {
  let result = "";
  const timeDate = new Date(timestamp);
  const date =
    timeDate.getDate() < 10 ? `0${timeDate.getDate()}` : timeDate.getDate();
  const month =
    timeDate.getMonth() + 1 < 10
      ? `0${timeDate.getMonth() + 1}`
      : timeDate.getMonth() + 1;
  const hour =
    timeDate.getHours() < 10 ? `0${timeDate.getHours()}` : timeDate.getHours();
  const minute =
    timeDate.getMinutes() < 10
      ? `0${timeDate.getMinutes()}`
      : timeDate.getMinutes();

  result = `${date}/${month}/${timeDate.getFullYear()} - ${hour}:${minute}`;

  return result;
};
