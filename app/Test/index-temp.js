import fs from "fs/promises";
import path from "path";
import { TEST_CONFIG } from "../../constant.js";
import {
  buildLinkToSymbol,
  calculateTimeout15m,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
  timeToSpecificTime,
} from "../../utils.js";
import util from "util";
import { checkSafetyPrice } from "../handlers/TrackingPriceSafety/utils.js";
import { checkHasBigPriceTrend } from "../handlers/TrackingBigPriceTrend/utils.js";
import {
  checkAvailableOrder,
  checkAvailableOrderV2,
} from "../execute/ExecuBuySellRestricted/utils.js";
import { checkAbleOrderSMC } from "../execute/ExecuteSMC/utils.js";
import { COST, REWARD, RR } from "../execute/ExecuteSMC/constant.js";

export const Test = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();

  // directory
  const fileName = "MOCK_DATA_TRADE.json";
  const filePath = path.join(".", fileName);
  let countTP = 0;
  let countSL = 0;
  let payloadAccount;

  try {
    payloadAccount = TEST_CONFIG;
    // const dataStoraged = await fs.readFile(filePath, "utf-8");
    // payloadAccount = JSON.parse(dataStoraged);
    // if (payloadAccount) {
    //   payloadAccount.orders = payloadAccount.orders.map((order) => {
    //     return {
    //       ...order,
    //       isCheckMinMax: true,
    //     };
    //   });
    // }
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

  const writeToDisk = async () => {
    try {
      await writeFile(filePath, JSON.stringify(dataAccount, null, 2));
      console.log("Write to file successful!");
    } catch (error) {
      console.error("Error writing to file:", error);
    }
  };

  bot.sendMessage(
    chatId,
    `Tài khoản hiện tại của bạn là ${dataAccount.account}$`
  );
  const handleData = (listSymbols) => {
    if (dataAccount.orders.length) {
      dataAccount.orders.forEach(async (order, index) => {
        const { symbol, type, tp, sl, isCheckMinMax, startTime, percent } =
          order;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 2,
          },
        };

        if (isCheckMinMax) {
          const endTime = new Date();
          params.data.interval = "1m";
          params.data.limit = 1000;
          params.data.startTime = startTime;
          params.data.endTime = endTime.getTime();
        }

        const { data: candleStickData } = await fetchApiGetCandleStickData(
          params
        );
        if (candleStickData && candleStickData.length) {
          const [candleCheck, lastestCandle] = candleStickData;

          const maxPrice = isCheckMinMax
            ? Math.max(...candleStickData.map((price) => parseFloat(price[2])))
            : candleCheck[2];
          const minPrice = isCheckMinMax
            ? Math.min(...candleStickData.map((price) => parseFloat(price[3])))
            : candleCheck[3];
          if (dataAccount.orders[index]) {
            dataAccount.orders[index].isCheckMinMax = false;
          }

          if (type === "up" && minPrice <= sl) {
            dataAccount.account =
              dataAccount.account - REWARD - (REWARD * 0.1) / percent;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            countSL += 1;
            bot.sendMessage(
              chatId,
              `😭 SL lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${sl} - ${symbol}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && maxPrice >= sl) {
            dataAccount.account =
              dataAccount.account - REWARD - (REWARD * 0.1) / percent;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            countSL += 1;
            bot.sendMessage(
              chatId,
              `😭 SL lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${sl} - ${symbol}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "up" && maxPrice >= tp) {
            dataAccount.account =
              dataAccount.account + REWARD * RR - (REWARD * 0.1) / percent;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            countTP += 1;
            bot.sendMessage(
              chatId,
              `😍 TP lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${tp} - ${symbol}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && minPrice <= tp) {
            dataAccount.account =
              dataAccount.account + REWARD * RR - (REWARD * 0.1) / percent;
            dataAccount.orders = dataAccount.orders.filter(
              (order) => order.symbol !== symbol
            );
            countTP += 1;
            bot.sendMessage(
              chatId,
              `😍 TP lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${tp} - ${symbol}`,
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

    bot.sendMessage(
      chatId,
      `Có ${countTP} lệnh đạt TP. \n
       Có ${countSL} lệnh chạm SL.
      `
    );

    if (listSymbols && listSymbols.length) {
      listSymbols.forEach(async (token, index) => {
        const { symbol, stickPrice } = token;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 100,
          },
        };

        const { data: candleStickData } = await fetchApiGetCandleStickData(
          params
        );
        if (candleStickData && candleStickData.length) {
          candleStickData.pop();
          // candleStickData.reverse();
          const { isAbleOrder, type, tpPercent, slPercent } = checkAbleOrderSMC(
            candleStickData,
            symbol
          );

          let typeOrder = type;

          // typeOrder = type === "up" ? "dowwn" : "up"; // reverse

          // const { isHasBigPrice, level, type, isBuySellSafety } =
          //   checkSafetyPrice(candleStickData, symbol);
          const numberCurrentOrder = dataAccount.orders.length;
          const numberOrderLong = dataAccount.orders.filter(
            (order) => order.type === "up"
          ).length;
          const numberOrderShort = numberCurrentOrder - numberOrderLong;
          if (
            isAbleOrder &&
            dataAccount.orders.every((order) => order.symbol !== symbol)
          ) {
            const data = await fetchApiGetCurrentPrice({
              symbol,
            });

            const { price } = data;
            let priceGap = 0;
            const lastestCandle = [...candleStickData.slice(-1)];

            if (typeOrder === "up") {
              priceGap =
                lastestCandle[4] < price ? price - lastestCandle[4] : 0;
            } else if (typeOrder === "down") {
              priceGap =
                lastestCandle[4] > price ? lastestCandle[4] - price : 0;
            }
            const dataTime = new Date();
            const ratePriceTP =
              typeOrder === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
            const ratePriceSL =
              typeOrder === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;
            const newOrder = {
              symbol,
              entry: +price,
              tp:
                ratePriceTP * price +
                (typeOrder === "up" ? priceGap * RR : -priceGap * RR),
              sl:
                ratePriceSL * price +
                (typeOrder === "up" ? -priceGap : priceGap),
              type: typeOrder,
              startTime: dataTime.getTime(),
              isCheckMinMax: true,
              percent: slPercent,
            };
            dataAccount.orders.push(newOrder);
            bot.sendMessage(
              chatId,
              `Thực hiện lệnh ${
                typeOrder === "up" ? "LONG" : "SHORT"
              } ${buildLinkToSymbol(symbol)} tại giá ${price}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          }
        }
      });
    }
  };

  setTimeout(
    () => {
      handleData(listSymbols);
      setInterval(() => {
        handleData(listSymbols);
        // console.log(JSON.stringify(dataAccount, null, 2));
      }, 5 * 60 * 1000);
    },
    0
    //  calculateTimeout15m()
  );
};
