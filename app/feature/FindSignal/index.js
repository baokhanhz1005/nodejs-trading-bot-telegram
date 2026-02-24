import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import {
  classifyTrend,
  getEMA,
  getListHighest,
  getListLowest,
  TREND,
} from "../../../utils/handleDataCandle.js";
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
          limit: LIMIT + 1,
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
        candleStickData.pop();
        const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
          candleStickData.slice(-5);
        if (candleStickData.length < LIMIT) continue;

        const EMA200 = getEMA(200, candleStickData.slice(-200));
        const EMA100 = getEMA(100, candleStickData.slice(-100));
        const EMA50 = getEMA(50, candleStickData.slice(-50));
        const EMA20 = getEMA(20, candleStickData.slice(-20));

        const lookback = 100;

        const listHighest = getListHighest(
          candleStickData.slice(-lookback),
          8,
          2,
        );
        const listLowest = getListLowest(
          candleStickData.slice(-lookback),
          8,
          2,
        );

        const highs = listHighest.map((p) => p.price);
        const lows = listLowest.map((p) => p.price);
        const trend = classifyTrend(highs, lows);
        let CONDITIONS = {};

        if (trend === TREND.UP) {
          CONDITIONS = {
            COND_1: () =>
              candleStickData
                .slice(-5)
                .some(
                  (candle) =>
                    (+candle[3] < +EMA100 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] > EMA100)) ||
                    (+candle[3] < +EMA200 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] > EMA200)),
                ),
            COND_2: () =>
              candleStickData.slice(-5).reduce((acc, candle) => {
                if (isDownCandle(candle)) {
                  return acc + 1;
                }

                return acc;
              }, 0) >= 4,
          };
        } else if (trend === TREND.DOWN) {
          CONDITIONS = {
            COND_1: () =>
              candleStickData
                .slice(-5)
                .some(
                  (candle) =>
                    (+candle[2] > +EMA100 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA100)) ||
                    (+candle[2] > +EMA200 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA200)),
                ),
            COND_2: () =>
              candleStickData.slice(-5).reduce((acc, candle) => {
                if (isUpCandle(candle)) {
                  return acc + 1;
                }

                return acc;
              }, 0) >= 4,
          };
        }

        const IS_PASS_CONDITION =
          Object.keys(CONDITIONS).length &&
          Object.values(CONDITIONS).every((cond) => !!cond());

        if (IS_PASS_CONDITION) {
          const mess = `${trend} - ${buildLinkToSymbol(symbolCandle)}`;
          listMessage.push(mess);
        }
      }
    }
  });

  if (listMessage.length) {
    let messSend = [];
    listMessage.forEach((mess, index) => {
      if (index <= 30) {
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
      }
    });
  } else {
    bot.sendMessage(chatId, "No found");
  }
};
