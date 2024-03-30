import fs from "fs/promises";
import path from "path";
import util from "util";
import {
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";

import { isCheckCandleHistory, isOtherMethod, isTotalOrder } from "./constants.js";
import brain from 'brain.js';
import { MACD } from 'technicalindicators';
export const MachineLearningTrading = async (payload) => {
  try {
    const { bot, chatId, timeLine } = payload;

    const fileName = "DATA_CANDLE.json";
    const filePath = path.join("./", fileName);
    let dataCandle;
    try {
      if (isCheckCandleHistory) {
        const dataStoraged = await fs.readFile(filePath, "utf-8");
        if (dataStoraged) {
          dataCandle = JSON.parse(dataStoraged);
        }
      }
      console.log("Get from try");
    } catch (e) {
      console.log("Get from catch");
      dataCandle = null;
    }

    const writeFile = util.promisify(fs.writeFile);

    const writeToDisk = async (dataCandle) => {
      try {
        await writeFile(filePath, JSON.stringify(dataCandle, null, 2));
        console.log("Write to file successful!");
      } catch (error) {
        console.error("Error writing to file:", error);
      }
    };

    const listSymbols = await fetchApiGetListingSymbols();
    if (listSymbols && listSymbols.length) {
      const promiseCandleData = dataCandle
        ? dataCandle
        : listSymbols.filter(each => false || ['OPUSDT'].includes(each.symbol)).map(async (token) => {
          const { symbol, stickPrice } = token;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: 1000, // 388 -- 676 -- 964
            },
          };
          const res = await fetchApiGetCandleStickData(params);
          return res;
        });

      Promise.all(promiseCandleData).then(async (res) => {
        if (res.length) {
          if (!dataCandle && isCheckCandleHistory) {
            await writeToDisk(res);
          }
          res.forEach((candleInfo, index) => {
            const { symbol: symbolCandle, data: candleStickData } = candleInfo;

            if (candleStickData && candleStickData.length) {
              // const dataTesst = candleStickData.slice(-2)[0].slice(1, 5);

              // const trainingData = [];

              // for (let i = 0; i < candleStickData.length - 6; i++) { // Trừ 6 để dự đoán 5 cây nến tiếp theo
              //   const currentData = candleStickData[i];
              //   const nextFiveCandles = candleStickData[i + 1]; // 5 cây nến tiếp theo
              //   const input = currentData.slice(1, 5); // Bỏ qua thời gian, sử dụng giá mở, giá cao, giá thấp của nến hiện tại làm input
              //   const output = [nextFiveCandles[4]];
              //   trainingData.push({ input, output });
              // }

              // const net = new brain.NeuralNetwork();

              // // net.train(trainingData);
              // net.train(trainingData, { log: (stats) => console.log(stats) });

              // const newCandle = dataTesst; // Ví dụ: Dữ liệu của cây nến mới
              // const prediction = net.run(newCandle);

              // bot.sendMessage(chatId, `${prediction.join('---')}`);

              // trending 
              const closePrices = candleStickData.map(candle => parseFloat(candle[4]));

              // Tính toán chỉ báo MACD
              const macdInput = {
                values: closePrices,
                fastPeriod: 12, // Số nến cho fast EMA
                slowPeriod: 26, // Số nến cho slow EMA
                signalPeriod: 9, // Số nến cho signal line
                SimpleMAOscillator: false, // Sử dụng Exponential MA
                SimpleMASignal: false // Sử dụng Exponential MA
              };


              const macdResult = MACD.calculate(macdInput);
              // Lấy giá trị MACD line, Signal line và Histogram
              const macdLine = macdResult.map(result => result.MACD);
              const signalLine = macdResult.map(result => result.signal);
              const histogram = macdResult.map(result => result.histogram);

              // Xác định xu hướng dựa trên MACD và Signal line
              const lastMacd = macdLine[macdLine.length - 1];
              const lastSignal = signalLine[signalLine.length - 1];

              let trend;
              if (lastMacd > lastSignal) {
                trend = 'Trending Up';
              } else if (lastMacd < lastSignal) {
                trend = 'Trending Down';
              } else {
                trend = 'No Significant Trend';
              }
            }
          });
        }
      });
    }
  } catch (error) {
    console.error("Error in TestingFunction:", error);
  }
};
