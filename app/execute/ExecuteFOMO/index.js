import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";

export const ExecuteFOMO = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();

  const currentSecond = new Date().getSeconds();
  const timeRemaining = 60 - currentSecond;

  const executeBOT = () => {
    bot.sendMessage(chatId, "🎯🎯🎯🎯🎯🎯🎯");

    const promiseDataCandles = listSymbols
      .map((tokenInfo) => {
        const { symbol, stickPrice } = tokenInfo;
        const params = {
          data: {
            symbol: symbol,
            interval: "1m",
            limit: 3,
          },
        };

        if (symbol == "BTCSTUSDT") {
          return null;
        }

        return fetchApiGetCandleStickData(params);
      })
      .filter(Boolean);

    Promise.all(promiseDataCandles).then(async (responses) => {
      if (responses && responses.length) {
        for (const response of responses) {
          const { symbol: symbolCandle, data: candleStickData = [] } = response;

          const prevCandle = candleStickData[0];
          const lastestCandle = candleStickData[1];

          if (
            isUpCandle(prevCandle) &&
            isUpCandle(lastestCandle) &&
            lastestCandle[4] / lastestCandle[1] >= 1.0045
          ) {
            const message = `🟢🟢 ${buildLinkToSymbol(
              symbolCandle
            )} BULL SIGNAL ${
              (lastestCandle[4] / lastestCandle[1] - 1).toFixed(4) * 100
            }%\norder ${symbolCandle} ${
              lastestCandle[3] * 0.999
            } up 1.5\n-------------------------------------`;
            bot.sendMessage(chatId, message, {
              parse_mode: "HTML",
              disable_web_page_preview: true,
            });
          } else if (
            isDownCandle(prevCandle) &&
            isDownCandle(lastestCandle) &&
            lastestCandle[1] / lastestCandle[4] >= 1.0045
          ) {
            const message = `🔴🔴 ${buildLinkToSymbol(
              symbolCandle
            )} BEAR SIGNAL ${
              (lastestCandle[1] / lastestCandle[4] - 1).toFixed(4) * 100
            }%\norder ${symbolCandle} ${
              lastestCandle[2] * 1.001
            } down 1.5\n-------------------------------------`;
            bot.sendMessage(chatId, message, {
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
