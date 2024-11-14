import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";

export const FindExtremeTrending = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  const isCheckRealTime = true;

  const listMessage = [];
  const indexCandleCheck = isCheckRealTime ? 1 : 0;
  const listSymbols = await fetchApiGetListingSymbols();
  let isUpBTC = false;
  const promiseDataCandles = listSymbols
    .map((tokenInfo) => {
      const { symbol, stickPrice } = tokenInfo;
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: 2,
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
      const candleInfoBTC = responses.find((info) => info.symbol === "BTCUSDT");
      if (!candleInfoBTC) return;
      isUpBTC = isUpCandle(candleInfoBTC.data[indexCandleCheck]);

      for (const response of responses) {
        console.log(response);
        const { symbol: symbolCandle, data: candleStickData = [] } = response;
        const candleCheck = candleStickData[indexCandleCheck];

        if (!candleCheck) return;

        if (isUpBTC) {
          if (
            isUpCandle(candleCheck) &&
            candleCheck[4] / candleCheck[1] > 1.015
          ) {
            const mess = `${buildLinkToSymbol(symbolCandle)} is UP ${
              (candleCheck[4] / candleCheck[1] - 1).toFixed(4) * 100
            }%`;
            listMessage.push(mess);
          }
        } else {
          if (
            isUpCandle(candleCheck) &&
            candleCheck[4] / candleCheck[1] > 1.005
          ) {
            const mess = `${buildLinkToSymbol(symbolCandle)} is UP ${
              (candleCheck[4] / candleCheck[1] - 1).toFixed(4) * 100
            }%`;
            listMessage.push(mess);
          }
        }
      }
    }
  });

  bot.sendMessage(chatId, `BTC is ${isUpBTC ? "UP" : "DOWN"}`);

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
