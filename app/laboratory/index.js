import {
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPositionAccount,
  fetchApiGetListingSymbols,
} from "../../utils.js";
import { getListHighest, isUpTrending } from "../../utils/handleDataCandle.js";
import { FindExtremeTrending } from "../feature/FindExtremeTrending/index.js";
import AccountService from "../../services/Account.js";
import OrderServices from "../../services/Order.js";
import { ExecuteFOMO } from "../execute/ExecuteFOMO/index.js";

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
  //     .filter((each) => each.symbol === "BOMEUSDT")
  //     .map(async (token) => {
  //       const { symbol, stickPrice } = token;

  //       const params = {
  //         data: {
  //           symbol: symbol,
  //           interval: timeLine,
  //           limit: 200, // 388 -- 676 -- 964
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
  //           const listHighest = getListHighest(candleStickData);
  //           const listHighestValue = listHighest.map((peak) => +peak.price);
  //           const isUpTrending = isUpTrending(listHighestValue, 2)

  //           // bot.sendMessage(chatId, `${listHighestValue.join(" -- ")}`);
  //         }
  //       });
  //     }
  //   });
  // }
};
