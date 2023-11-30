import { TEST_CONFIG } from "../../../constant.js";
import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
  timeToSpecificTime,
} from "../../../utils.js";
import { checkHasBigPriceTrend } from "../TrackingBigPriceTrend/utils.js";

export const Test = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  let count = 0;
  const account = TEST_CONFIG;

  bot.sendMessage(chatId, `Tài khoản hiện tại của bạn là ${account.account}$`);
  const handleData = (listSymbols) => {
    if (account.orders.length) {
      account.orders.forEach(async (order, index) => {
        const { symbol, type, tp, sl } = order;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 2,
          },
        };

        const candleStickData = await fetchApiGetCandleStickData(params);
        if (candleStickData && candleStickData.length) {
          const [candleCheck, lastestCandle] = candleStickData;

          if (type === "up" && candleCheck[3] >= tp) {
            account.account = account.account + 0.1;
            account.orders = account.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `TP lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${tp}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "up" && candleCheck[2] <= sl) {
            account.account = account.account - 0.6;
            account.orders = account.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `SL lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${sl}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && candleCheck[2] <= tp) {
            account.account = account.account + 0.1;
            account.orders = account.orders.filter(
              (order) => order.symbol !== symbol
            );
            bot.sendMessage(
              chatId,
              `TP lệnh ${type === "up" ? "LONG" : "SHORT"} ${buildLinkToSymbol(
                symbol
              )} tại giá ${tp}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          } else if (type === "down" && candleCheck[3] >= sl) {
            account.account = account.account - 0.6;
            account.orders = account.orders.filter(
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
      `Tài khoản hiện tại của bạn là ${account.account}$ và có ${account.orders.length} lệnh đang chạy`
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

        const candleStickData = await fetchApiGetCandleStickData(params);
        if (candleStickData && candleStickData.length) {
          candleStickData.pop();
          const { isHasBigPrice, level, type } = checkHasBigPriceTrend(
            candleStickData,
            symbol
          );

          if (
            isHasBigPrice &&
            level >= 5 &&
            account.orders.length < 30 &&
            account.orders.every((order) => order.symbol !== symbol)
          ) {
            const data = await fetchApiGetCurrentPrice({
              symbol,
            });
            const { price } = data;
            const ratePriceTP =
              type === "up"
                ? 1 + TEST_CONFIG.tpPercent / 100
                : 1 - TEST_CONFIG.tpPercent;
            const ratePriceSL =
              type === "up"
                ? 1 - TEST_CONFIG.setInterval / 100
                : 1 + TEST_CONFIG.slPercent;
            const newOrder = {
              symbol,
              entry: price,
              tp: ratePriceTP * price,
              sl: ratePriceSL * price,
              type,
            };
            account.orders.push(newOrder);
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
    }, 15 * 60 * 1000);
  }, 1 || timeToSpecificTime(15, 1));
};
