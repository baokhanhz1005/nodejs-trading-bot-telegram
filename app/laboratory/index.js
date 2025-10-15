import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPositionAccount,
  fetchApiGetListingSymbols,
} from "../../utils.js";
import {
  getListHighest,
  getMaxOnListCandle,
  getMinOnListCandle,
  getSmallestFractionPart,
  isUpTrending,
  validatePriceForTrade,
} from "../../utils/handleDataCandle.js";
import { FindExtremeTrending } from "../feature/FindSignal/index.js";
import AccountService from "../../services/Account.js";
import OrderServices from "../../services/Order.js";
import { ExecuteFOMO } from "../execute/ExecuteFOMO/index.js";
import { checkFullCandle, isUpCandle } from "../../utils/TypeCandle.js";
import { ExecuteFOMO_1m } from "../execute/ExecuteFOMO/index.1m.js";

export const TestFunctionUtility = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  ExecuteFOMO(payload);

  // const listPositionOrder = await fetchApiGetCurrentPositionAccount();

  // const test = listPositionOrder.find(each => each.symbol === 'CKBUSDT');

  // console.log(listPositionOrder);

  // const params = {
  //   data: {
  //     symbol: test.symbol,
  //     side: test.positionAmt > 0 ? 'SELL' : 'BUY',
  //     type: "MARKET",
  //     quantity: Math.abs(test.positionAmt),
  //     // leverage: 50,
  //     // newOrderRespType: "RESULT",
  //     timestamp: Date.now(),
  //   },
  // };

  // const resMarket = await OrderServices.market(params).catch((err) =>
  //   console.error("Error when order:", err)
  // );

  // console.log(resMarket);

  // await FindExtremeTrending(payload);
  // const listSymbols = await fetchApiGetListingSymbols();

  // if (listSymbols && listSymbols.length) {
  //   const promiseCandleData = listSymbols
  //     // .filter((each) => each.symbol === "BOMEUSDT")
  //     .map(async (token) => {
  //       const { symbol, stickPrice } = token;

  //       const params = {
  //         data: {
  //           symbol: symbol,
  //           interval: timeLine,
  //           limit: 2,
  //         },
  //       };

  //       const res = await fetchApiGetCandleStickData(params);

  //       return res;
  //     });

  //   Promise.all(promiseCandleData).then(async (res) => {
  //     if (res.length) {
  //       res.filter(Boolean).forEach((candleInfo) => {
  //         const { symbol: symbolCandle, data: candleStickData } = candleInfo;
  //         if (candleStickData && candleStickData.length) {
  //           const [lastestCandle, currentCandle] = candleStickData || [];
  //           // const listHighest = getListHighest(candleStickData);
  //           // const listHighestValue = listHighest.map((peak) => +peak.price);
  //           // const isUpTrending = isUpTrending(listHighestValue, 2);
  //           if (
  //             isUpCandle(currentCandle) &&
  //             currentCandle[4] > currentCandle[1]
  //           ) {
  //             bot.sendMessage(
  //               chatId,
  //               `${buildLinkToSymbol(symbolCandle)} --- ${
  //                 (currentCandle[4] / currentCandle[1] - 1) * 100
  //               }%`,
  //               {
  //                 parse_mode: "HTML",
  //                 disable_web_page_preview: true,
  //               }
  //             );
  //           }
  //         }
  //       });
  //     }
  //   });
  // }

  // const listSymbols = await fetchApiGetListingSymbols();
  // const listSymbolDeleteRemain = [];
  // const currentSecond = new Date().getSeconds();
  // const timeRemaining = 60 - currentSecond;

  // bot.on("message", async (msg) => {
  //   const botId = (await bot.getMe()).id;
  //   if (msg.from && msg.from.id === botId) {
  //     console.log(msg);
  //     const contentToPin = ["😍😍 TP", "😭😭 SL"];
  //     if (contentToPin.some((keyword) => msg.text?.includes(keyword))) {
  //       try {
  //         await bot.pinChatMessage(chatId, msg.message_id);
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     }
  //   }
  // });

  // const executeBOT = async () => {
  //   bot.sendMessage(chatId, "🎯🎯🎯🎯🎯🎯🎯");
  //   const mapListOrders = {};

  //   const promiseDataCandles = listSymbols
  //     .map((tokenInfo) => {
  //       const { symbol, stickPrice } = tokenInfo;
  //       const params = {
  //         data: {
  //           symbol: symbol,
  //           interval: timeLine,
  //           limit: 150,
  //         },
  //       };

  //       if (symbol == "BTCSTUSDT") {
  //         return null;
  //       }

  //       return fetchApiGetCandleStickData(params);
  //     })
  //     .filter(Boolean);

  //   // await fetchApiHandleResultOrder(
  //   //   payload,
  //   //   mapListOrders,
  //   //   listSymbolDeleteRemain,
  //   //   Date.now()
  //   // );

  //   Promise.all(promiseDataCandles).then(async (responses) => {
  //     if (responses && responses.length) {
  //       for (const response of responses) {
  //         const { symbol: symbolCandle, data: candleStickData = [] } = response;

  //         const newestCandle = candleStickData.slice(-1)[0];
  //         const dateTimeCandle = new Date(newestCandle[0]);
  //         const currentTime = new Date();
  //         if (
  //           Number(dateTimeCandle.getMinutes()) ===
  //           Number(currentTime.getMinutes())
  //         ) {
  //           candleStickData.pop();
  //         }
  //         const [prevCandle, lastestCandle] = candleStickData.slice(-2);
  //         const minimumFractionalPart = getSmallestFractionPart(lastestCandle);

  //         const rangeCandle30 = candleStickData.slice(-30);
  //         const maxRange30 = getMaxOnListCandle(rangeCandle30, 4);
  //         const minRange30 = getMinOnListCandle(rangeCandle30, 4);

  //         const rateRange =
  //           (lastestCandle[4] / minRange30 - 1) /
  //           (lastestCandle[4] / lastestCandle[1] - 1);

  //         const isAbleOrder =
  //           checkFullCandle(lastestCandle, "up") &&
  //           rateRange <= 2.5 &&
  //           (lastestCandle[4] / lastestCandle[1] - 1) * 100 > 0.45;

  //         const type = "up";

  //         if (
  //           isAbleOrder &&
  //           lastestCandle[4] <= 5 &&
  //           validatePriceForTrade(candleStickData.slice(-1)[0][4])
  //         ) {
  //           const message = `${
  //             type === "up" ? "🟢🟢" : "🔴🔴"
  //           } ${buildLinkToSymbol(symbolCandle)} ${
  //             type === "up" ? "BULL" : "BEAR"
  //           } SIGNAL`;

  //           bot.sendMessage(chatId, message, {
  //             parse_mode: "HTML",
  //             disable_web_page_preview: true,
  //           });
  //         }
  //       }
  //     }
  //   });
  // };

  // setTimeout(() => {
  //   executeBOT();
  //   setInterval(() => {
  //     executeBOT();
  //   }, 5 * 60 * 1000);
  // }, timeRemaining * 1000 + 500);
};
