import fs from "fs/promises";
import path from "path";
import { TEST_CONFIG } from "../../../constant.js";
import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
  timeToSpecificTime,
} from "../../../utils.js";
import { checkHasBigPriceTrend } from "../TrackingBigPriceTrend/utils.js";
import util from 'util';

export const Test = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();

  // directory
  const fileName = "MOCK_DATA_TRADE.json";
  const filePath = path.join(".", fileName);

  let payloadAccount;

  try {
    const dataStoraged = await fs.readFile(filePath, "utf-8");
    payloadAccount = JSON.parse(dataStoraged);
    if (payloadAccount) {
      payloadAccount.orders = payloadAccount.orders.map(order => {
          return {
            ...order,
            isCheckMinMax: true,
          }
      })
    }
    console.log("Get from try");
  } catch (e) {
    console.log("Get from catch");
    payloadAccount = TEST_CONFIG;
  }

  const dataAccount = payloadAccount;

  const writeFile = util.promisify(fs.writeFile);
  process.on("SIGINT", async () => {
    console.log(
      "Caught interrupt signal (Ctrl+C). Writing to file before exiting..."
    );
    await writeToDisk();
    process.exit();
  });

  process.on("uncaughtException", async (error) => {
    console.error(
      "Uncaught exception. Writing to file before exiting...",
      error
    );
    await writeToDisk();
    process.exit(1);
  });

  const writeToDisk = async() => {
    try {
      await writeFile(filePath, JSON.stringify(dataAccount, null, 2));
      console.log('Write to file successful!');
    } catch (error) {
      console.error('Error writing to file:', error);
    }
  }

  bot.sendMessage(
    chatId,
    `Tài khoản hiện tại của bạn là ${dataAccount.account}$`
  );
  const handleData = (listSymbols) => {
    if (dataAccount.orders.length) {
      dataAccount.orders.forEach(async (order, index) => {
        const { symbol, type, tp, sl, isCheckMinMax, startTime } = order;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 2,
          },
        };

        if (isCheckMinMax) {
          const endTime = new Date();
          params.data.interval = '1m';
          params.data.limit = 1000;
          params.data.startTime = startTime;
          params.data.endTime = endTime.getTime();
        }
        
        const { data: candleStickData } = await fetchApiGetCandleStickData(
          params
        );
        if (candleStickData && candleStickData.length) {
          if (index < 2) {
            console.log(candleStickData.length);
          }
          const [candleCheck, lastestCandle] = candleStickData;
          
          const maxPrice = isCheckMinMax ? Math.max(...candleStickData.map(price => parseFloat(price[2]))) : candleCheck[2];
          const minPrice = isCheckMinMax ? Math.min(...candleStickData.map(price => parseFloat(price[3]))) : candleCheck[3];
          if (dataAccount.orders[index]) {
            dataAccount.orders[index].isCheckMinMax = false;
          }
          
          if (type === "up" && maxPrice >= tp) {
            dataAccount.account = dataAccount.account + 0.1;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `TP lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${tp}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "up" && minPrice <= sl) {
            dataAccount.account = dataAccount.account - 0.6;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `SL lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${sl}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && minPrice <= tp) {
            dataAccount.account = dataAccount.account + 0.1;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `TP lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${tp}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && maxPrice >= sl) {
            dataAccount.account = dataAccount.account - 0.6;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `SL lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${sl}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          }
        }
      });
    }

    bot.sendMessage(
      chatId,
      `Tài khoản hiện tại của bạn là ${dataAccount.account}$ và có ${dataAccount.orders.length} lệnh đang chạy, ${listSymbols.length}`
    );

    if (listSymbols && listSymbols.length) {
      listSymbols.forEach(async (symbol, index) => {
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 50,
          },
        };

        const { data: candleStickData } = await fetchApiGetCandleStickData(
          params
        );
        if (candleStickData && candleStickData.length) {
          candleStickData.pop();
          const { isHasBigPrice, level, type } = checkHasBigPriceTrend(
            candleStickData,
            symbol
          );

          if (
            isHasBigPrice &&
            level >= 5 &&
            dataAccount.orders.length < 30 &&
            dataAccount.orders.every((order) => order.symbol !== symbol)
          ) {
            const data = await fetchApiGetCurrentPrice({
              symbol,
            });
            const { price } = data;
            const dataTime = new Date();
            const ratePriceTP =
              type === "up"
                ? 1 + dataAccount.tpPercent / 100
                : 1 - dataAccount.tpPercent / 100;
            const ratePriceSL =
              type === "up"
                ? 1 - dataAccount.slPercent / 100
                : 1 + dataAccount.slPercent / 100;
            const newOrder = {
              symbol,
              entry: +price,
              tp: ratePriceTP * price,
              sl: ratePriceSL * price,
              type,
              startTime: dataTime.getTime(),
              isCheckMinMax: true,
            };
            dataAccount.orders.push(newOrder);
            bot.sendMessage(
              chatId,
              `Thực hiện lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${price}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          }
        }
      });
    }
  };

  setTimeout(() => {
    handleData(listSymbols);
    setInterval(() => {
      handleData(listSymbols);
      console.log(JSON.stringify(dataAccount, null, 2));
    }, 15 * 60 * 1000);
  }, 1 || timeToSpecificTime(15, 1));
};
