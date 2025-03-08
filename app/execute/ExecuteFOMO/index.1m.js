import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
  fetchApiHandleResultOrder,
} from "../../../utils.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";
import { CONFIG_QUICK_TRADE } from "./config.js";
import { checkAbleQuickOrder1M } from "./utils.1m.js";
import { checkAbleQuickOrder } from "./utils.js";

const { COST } = CONFIG_QUICK_TRADE;

export const ExecuteFOMO_1m = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  const listSymbolDeleteRemain = [];
  const currentSecond = new Date().getSeconds();
  const timeRemaining = 60 - currentSecond;

  bot.on("message", async (msg) => {
    const botId = (await bot.getMe()).id;
    if (msg.from && msg.from.id === botId) {
      const contentToPin = ["😍😍 TP", "😭😭 SL"];
      if (contentToPin.some((keyword) => msg.text?.includes(keyword))) {
        try {
          await bot.pinChatMessage(chatId, msg.message_id);
        } catch (error) {
          console.error(error);
        }
      }
    }
  });

  const executeBOT = async () => {
    bot.sendMessage(chatId, "🎯🎯🎯🎯🎯🎯🎯");
    const mapListOrders = {};

    const promiseDataCandles = listSymbols
      .map((tokenInfo) => {
        const { symbol, stickPrice } = tokenInfo;
        const params = {
          data: {
            symbol: symbol,
            interval: "1m",
            limit: 150,
          },
        };

        if (symbol == "BTCSTUSDT") {
          return null;
        }

        return fetchApiGetCandleStickData(params);
      })
      .filter(Boolean);

    await fetchApiHandleResultOrder(
      payload,
      mapListOrders,
      listSymbolDeleteRemain,
      Date.now()
    );

    Promise.all(promiseDataCandles).then(async (responses) => {
      if (responses && responses.length) {
        for (const response of responses) {
          const { symbol: symbolCandle, data: candleStickData = [] } = response;

          const newestCandle = candleStickData.slice(-1)[0];
          const dateTimeCandle = new Date(newestCandle[0]);
          const currentTime = new Date();
          if (
            Number(dateTimeCandle.getMinutes()) ===
            Number(currentTime.getMinutes())
          ) {
            candleStickData.pop();
          }

          const [prevCandle, lastestCandle] = candleStickData.slice(-2);

          const {
            type,
            symbol,
            isAbleOrder,
            tpPercent,
            slPercent,
            timeStamp,
            entry,
          } = checkAbleQuickOrder1M(candleStickData, symbolCandle);

          if (
            isAbleOrder &&
            lastestCandle[4] <= 5 &&
            validatePriceForTrade(candleStickData.slice(-1)[0][4])
          ) {
            const ratePriceSL =
              type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

            const message = `${
              type === "up" ? "🟢🟢" : "🔴🔴"
            } ${buildLinkToSymbol(symbolCandle)} ${
              type === "up" ? "BULL" : "BEAR"
            } SIGNAL ${slPercent}%`;

            bot.sendMessage(chatId, message, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `order ${symbolCandle} ${
                        lastestCandle[4] * ratePriceSL
                      } ${type} ${COST} --- entry: ${entry}`,
                      callback_data: `order ${symbolCandle} ${
                        lastestCandle[4] * ratePriceSL
                      } ${type} ${COST}`,
                    },
                  ],
                ],
              },
              parse_mode: "HTML",
              disable_web_page_preview: true,
            });
          }
        }
      }
    });
  };

  setTimeout(() => {
    executeBOT();
    setInterval(() => {
      executeBOT();
    }, 1 * 60 * 1000);
  }, timeRemaining * 1000 + 500);
};
