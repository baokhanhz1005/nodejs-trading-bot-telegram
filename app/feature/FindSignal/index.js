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
  getMaxOnListCandle,
  getMinOnListCandle,
  TREND,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";

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

        const avgCandleBody =
          candleStickData.slice(-50).reduce((acc, candle) => {
            return (acc += Math.abs(+candle[1] - +candle[4]));
          }, 0) / 50;

        const EMA200 = getEMA(200, candleStickData.slice(-200));
        const EMA100 = getEMA(100, candleStickData.slice(-100));
        const EMA50 = getEMA(50, candleStickData.slice(-50));
        const EMA20 = getEMA(20, candleStickData.slice(-20));

        const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
        const max4Range10 = getMaxOnListCandle(candleStickData.slice(-10), 4);

        const min3Range15 = getMinOnListCandle(candleStickData.slice(-15), 3);
        const max2Range15 = getMaxOnListCandle(candleStickData.slice(-15), 2);
        const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
        const min4Range15 = getMinOnListCandle(candleStickData.slice(-15), 4);

        const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);
        const max2Range30 = getMaxOnListCandle(candleStickData.slice(-30), 2);
        const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
        const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

        const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
        const min4Range50 = getMinOnListCandle(candleStickData.slice(-50), 4);
        const min3Range50 = getMinOnListCandle(candleStickData.slice(-50), 3);

        const min4Range100 = getMinOnListCandle(candleStickData.slice(-100), 4);
        const max4Range100 = getMaxOnListCandle(candleStickData.slice(-100), 4);

        const max4Range0To50 = getMinOnListCandle(
          candleStickData.slice(0, 50),
          4,
        );

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
        const trend = classifyTrend(highs, lows, 2, 0.993);
        let CONDITIONS = {};
        const MULTI = 0;

        if (trend === TREND.UP) {
          CONDITIONS = {
            COND_1: () =>
              candleStickData
                .slice(-5)
                .some(
                  (candle) =>
                    (+candle[3] < +EMA20 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] > EMA20)) ||
                    (+candle[3] + avgCandleBody * MULTI < +EMA50 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] > EMA50)) ||
                    (+candle[2] - avgCandleBody * MULTI > +EMA100 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA100)),
                ),
            COND_4: () =>
              candleStickData.slice(-5).some((candle, index) => {
                const nextCandle = candleStickData.slice(-5)[index + 1];
                if (nextCandle) {
                  return (
                    isUpCandle(candle) &&
                    isDownCandle(nextCandle) &&
                    nextCandle[4] < candle[1]
                  );
                  // return (
                  //   isDownCandle(candle) &&
                  //   isUpCandle(nextCandle) &&
                  //   nextCandle[4] > candle[1]
                  // );
                }
                return false;
              }),
          };
        } else if (trend === TREND.DOWN) {
          CONDITIONS = {
            COND_1: () =>
              candleStickData
                .slice(-5)
                .some(
                  (candle) =>
                    (+candle[2] > +EMA20 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA20)) ||
                    (+candle[2] - avgCandleBody * MULTI > +EMA50 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA50)) ||
                    (+candle[2] - avgCandleBody * MULTI > +EMA100 &&
                      candleStickData
                        .slice(-10)
                        .every((cand) => cand[4] < EMA100)),
                ),
            COND_4: () =>
              candleStickData.slice(-5).some((candle, index) => {
                const nextCandle = candleStickData.slice(-5)[index + 1];
                if (nextCandle) {
                  return (
                    isDownCandle(candle) &&
                    isUpCandle(nextCandle) &&
                    nextCandle[4] > candle[1]
                  );
                  // return (
                  //   isUpCandle(candle) &&
                  //   isDownCandle(nextCandle) &&
                  //   nextCandle[4] < candle[1]
                  // );
                }
                return false;
              }),
          };
        }

        const IS_PASS_CONDITION =
          Object.keys(CONDITIONS).length &&
          Object.values(CONDITIONS).every((cond) => !!cond());

        if (IS_PASS_CONDITION) {
          const mess = `${trend} - ${buildLinkToSymbol(symbolCandle)} - Order ${symbolCandle} ${lastestCandle[4]} ${trend === TREND.UP ? "up" : "down"} 0.5`;
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
