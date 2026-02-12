import {
  classifyTrend,
  findContinueSameTypeCandle,
  getEMA,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
  isUpTrending,
  TREND,
} from "../../../../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isHitFVG,
  isUpCandle,
} from "../../../../../../utils/TypeCandle.js";

export const checkPattern_1 = (candleStickData, symbol, typeCheck) => {
  //   const count = candleStickData.length;
  const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
    candleStickData.slice(-4);

  let type = "";
  let isAllowOrder = false;
  let slPercent = 1;
  let methodRR = "";
  let tpPercent = null;
  let timeStamp = "";

  // init data
  let CONDITION = {};
  let currentRR = 1;
  let EstRR = 1;

  const EMA200 = getEMA(200, candleStickData.slice(-200));
  const EMA50 = getEMA(50, candleStickData.slice(-50));
  const EMA20 = getEMA(20, candleStickData.slice(-20));

  const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
  const max4Range10 = getMaxOnListCandle(candleStickData.slice(-10), 4);

  const min3Range15 = getMinOnListCandle(candleStickData.slice(-15), 3);
  const max2Range15 = getMaxOnListCandle(candleStickData.slice(-15), 2);
  const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);
  const max2Range30 = getMaxOnListCandle(candleStickData.slice(-30), 2);
  const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
  const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

  const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
  const min4Range50 = getMinOnListCandle(candleStickData.slice(-50), 4);
  const min3Range50 = getMinOnListCandle(candleStickData.slice(-50), 3);

  const max4Range0To50 = getMinOnListCandle(candleStickData.slice(0, 50), 4);

  const avgCandleBody =
    candleStickData.slice(-50).reduce((acc, candle) => {
      return (acc += Math.abs(+candle[1] - +candle[4]));
    }, 0) / 50;
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
    candleStickData.slice(-15),
  );

  const lookback = 100;

  const listHighest = getListHighest(candleStickData.slice(-lookback), 8, 2);
  const listLowest = getListLowest(candleStickData.slice(-lookback), 8, 2);

  const highs = listHighest.map((p) => p.price);
  const lows = listLowest.map((p) => p.price);

  const trend = classifyTrend(highs, lows);

  const RANGE_EXCHANGE_LEVEL = (max4Range50 - min4Range50) / avgCandleBody;

  if (RANGE_EXCHANGE_LEVEL <= 10) {
    CONDITION = {};
  } else if (trend === TREND.UP && true) {
    type = "up";
    // LONG
    if (lastestCandle[4] > EMA200) {
      if (EMA20 > EMA50) {
        if (lastestCandle[4] > EMA20) {
          EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1;
          type = "up";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 0.5 && EstRR < 1,
            COND_2: () => isUpCandle(lastestCandle) && isUpCandle(prevCandle),
            COND_3: () => min3Range15 === min3Range30,
            COND_4: () => max4Range50 !== max4Range15,
          };

          CONDITION = {}; // debug
        } else {
          EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1;
          type = "up";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 0.5 && EstRR < 1,
            COND_2: () => isUpCandle(lastestCandle),
            COND_3: () =>
              (max4Range10 - lastestCandle[4]) /
                (lastestCandle[4] - min3Range15) <=
              1.5,
            COND_4: () =>
              (lastestCandle[4] - lastestCandle[1]) / avgCandleBody <= 1,
            // COND_5: () => max4Range0To50 > EMA200,
          };

          CONDITION = {}; // debug
        }
      } else {
        if (lastestCandle[4] > EMA20) {
          EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1;
          type = "up";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 0.5 && EstRR < 1,
            COND_2: () => isUpCandle(lastestCandle),
          };
        } else {
        }
      }
    } else {
      if (EMA20 > EMA50) {
        // handle condition
      } else {
        // handle condition
      }
    }
  } else if (trend === TREND.DOWN && false) {
    // logic SHORT
  } else if (trend === TREND.RANGE) {
    // logic RANGE
  }

  // if (RANGE_EXCHANGE_LEVEL <= 10) {
  //   CONDITION = {};
  // }

  const isPassCondition =
    Object.values(CONDITION).length &&
    Object.values(CONDITION).every((cond) => cond());

  if (isPassCondition) {
    slPercent = EstRR;
    tpPercent = EstRR * currentRR;
    isAllowOrder = true;
    methodRR = currentRR;
    timeStamp = lastestCandle[0];
  }

  return {
    type,
    slPercent,
    isAllowOrder,
    timeStamp,
    entry: lastestCandle[4],
    tpPercent,
    methodRR,
    keyFn: "pattern_S1",
  };
};
