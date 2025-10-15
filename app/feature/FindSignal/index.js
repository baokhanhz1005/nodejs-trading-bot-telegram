import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { getEMA } from "../../../utils/handleDataCandle.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";

export const FindExtremeTrending = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  const isCheckRealTime = true;

  const listMessage = [];
  const indexCandleCheck = isCheckRealTime ? 1 : 0;
  const listSymbols = await fetchApiGetListingSymbols();
  let isUpBTC = false;
  const LIMIT = 200;
  const promiseDataCandles = listSymbols
    .map((tokenInfo) => {
      const { symbol, stickPrice } = tokenInfo;
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: LIMIT,
        },
      };

      if (symbol == "BTCSTUSDT") {
        return null;
      }

      return fetchApiGetCandleStickData(params);
    })
    .filter(Boolean);

  await Promise.all(promiseDataCandles).then(async (responses) => {
    if (responses && responses.length) {
      for (const response of responses) {
        const { symbol: symbolCandle, data: candleStickData = [] } = response;

        const [
          forthLastCandle,
          thirdLastCandle,
          prevCandle,
          lastestCandle,
          currentCandle,
        ] = candleStickData.slice(-5);
        if (candleStickData.length < LIMIT) continue;
        const EMA200 = getEMA(200, candleStickData);
        /// HANDLE CONDTION FOR CHECK SIGNAL
        if (symbolCandle === "C98USDT") {
          console.log(
            symbolCandle,
            candleStickData.length,
            EMA200,
            lastestCandle[4]
          );
        }

        const CONDITIONS = {
          // COND_1: () =>
          //   candleStickData
          //     .slice(-5)
          //     .some(
          //       (candle) => isUpCandle(candle) && candle[2] / candle[1] >= 1.2
          //     ),
          COND_2: () =>
            isUpCandle(lastestCandle) &&
            lastestCandle[4] / lastestCandle[1] >= 1.015,
        };
        /// HANDLE CONDTION FOR CHECK SIGNAL

        const IS_PASS_CONDITION = Object.values(CONDITIONS).every(
          (cond) => !!cond()
        );
        if (IS_PASS_CONDITION) {
          const mess = `${buildLinkToSymbol(symbolCandle)}`;
          listMessage.push(mess);
        }
      }
    }
  });

  if (listMessage.length) {
    let messSend = [];
    listMessage.forEach((mess, index) => {
      messSend.push(mess);
      if ((index + 1) % 5 === 0 && messSend.length) {
        bot.sendMessage(chatId, `${messSend.join("\n")}`, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
        messSend = [];
      } else if (index === listMessage.length - 1 && messSend.length) {
        bot.sendMessage(chatId, `${messSend.join("\n")}`, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
        messSend = [];
      }
    });
  } else {
    bot.sendMessage(chatId, "No found");
  }
};
