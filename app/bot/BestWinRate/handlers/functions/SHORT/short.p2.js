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

export const checkPattern_2 = (candleStickData, symbol, typeCheck) => {
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
  let EstRR = 1;

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

  const trend = classifyTrend(highs, lows, 2, 0.993);

  const RANGE_EXCHANGE_LEVEL = (max4Range50 - min4Range50) / avgCandleBody;
  let currentRR = 1;

  if (RANGE_EXCHANGE_LEVEL <= 10) {
    CONDITION = {};
  } else if (trend === TREND.UP && false) {
    type = "up";
    // LONG
    if (lastestCandle[4] > EMA200) {
      // EMA20 vs EMA50
      if (EMA20 > EMA50) {
        // price vs EMA
        if (lastestCandle[4] > EMA20) {
          EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1;
          type = "up";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 1 && EstRR < 3,
            COND_2: () => checkFullCandle(lastestCandle, "up", avgCandleBody),
            COND_3: () => (EMA20 - EMA50) / avgCandleBody <= 4,
            COND_4: () => {
              const EMA20last15 = getEMA(
                20,
                candleStickData.slice(-35).slice(0, 20),
              );

              return (EMA20 - EMA20last15) / avgCandleBody >= 3;
            },
            COND_5: () =>
              !candleStickData
                .slice(-15)
                .some(
                  (candle) =>
                    isDownCandle(candle) &&
                    (candle[1] - candle[4]) / avgCandleBody >= 3,
                ),
            COND_6: () => (EMA50 - EMA200) / avgCandleBody >= 0.5,
            COND_7: () =>
              (max4Range30 - lastestCandle[4]) /
                (lastestCandle[4] - min3Range15) <=
              1,
            COND_8: () => (max4Range100 - min4Range100) / avgCandleBody <= 22,
          };

          CONDITION = {}; // debug   ********************************
        } else if (lastestCandle[4] < EMA20) {
          EstRR = (lastestCandle[4] / EMA50 - 1) * 100 * 1;
          type = "up";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 1 && EstRR < 3,
            COND_2: () => checkFullCandle(lastestCandle, "up", avgCandleBody),
            // COND_3: () => maxContinueDown <= 3,
            // COND_4: () => Math.abs(EMA50 - EMA20) > avgCandleBody * 2,
            // COND_3: () =>
            //   !candleStickData
            //     .slice(-15)
            //     .some((candle) => +candle[2] + avgCandleBody * 1.5 > EMA100),
            // COND_4: () =>
            //   candleStickData.slice(-15).reduce((acc, candle) => {
            //     if (
            //       isDownCandle(candle) &&
            //       (candle[1] - candle[4]) /
            //         (lastestCandle[4] - lastestCandle[1]) >=
            //         1
            //     ) {
            //       return acc + 1;
            //     }

            //     return acc;
            //   }, 0) <= 1,
            // COND_5: () =>
            //   isDownCandle(prevCandle)
            //     ? lastestCandle[4] > prevCandle[2]
            //     : true,
          };

          // CONDITION = {}; // debug  ********************************
        }
      } else if (EMA20 < EMA50) {
        if (lastestCandle[4] > EMA20) {
          // handle affter
        } else {
        }
      }
    } else if (lastestCandle[4] < EMA200) {
      if (EMA20 > EMA50) {
        // price vs EMA
        if (lastestCandle[4] > EMA20) {
          // EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1;
          // type = "up";
          // // condition
          // CONDITION = {
          //   COND_1: () => EstRR > 0.5 && EstRR < 1.2,
          // };
          // CONDITION = {}; // debug  ********************************
        } else if (lastestCandle[4] < EMA20) {
          // EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1;
          // type = "up";
          // // condition
          // CONDITION = {
          //   COND_1: () => EstRR > 0.5 && EstRR < 1.2,
          // };
          // CONDITION = {}; // debug  ********************************
        }
      } else if (EMA20 < EMA50) {
        // handle condition
        if (lastestCandle[4] > EMA20) {
          // EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1;
          // type = "up";
          // // condition
          // CONDITION = {
          //   COND_1: () => EstRR > 0.5 && EstRR < 1.2,
          // };
          // CONDITION = {}; // debug  ********************************
        } else {
          // EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1;
          // type = "up";
          // // condition
          // CONDITION = {
          //   COND_1: () => EstRR > 0.5 && EstRR < 1.2,
          //   COND_2: () =>
          //     isUpCandle(lastestCandle) &&
          //     (lastestCandle[4] - lastestCandle[1]) / avgCandleBody >= 0.75,
          // };
        }
      }
    }
  } else if (trend === TREND.DOWN && true) {
    type = "down";
    // LONG
    if (lastestCandle[4] < EMA200) {
      // EMA20 vs EMA50
      if (EMA20 < EMA50) {
        // price vs EMA
        if (lastestCandle[4] < EMA20) {
          EstRR = (max2Range15 / lastestCandle[4] - 1) * 100 * 1;
          type = "down";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 1 && EstRR < 3,
            COND_2: () => checkFullCandle(lastestCandle, "down", avgCandleBody),
            // COND_3: () =>
            //   !candleStickData
            //     .slice(-15)
            //     .some(
            //       (candle) =>
            //         isUpCandle(candle) &&
            //         (candle[4] - candle[1]) / avgCandleBody >= 3,
            //     ),
              
            // // COND_4: () =>
            // //   (max4Range50 - lastestCandle[4]) / avgCandleBody <= 15,
            // // COND_5: () => (EMA200 - EMA50) / avgCandleBody >= 0.5,
            // COND_4: () => (max4Range50 - EMA20) / avgCandleBody <= 10,
            // // COND_5: () => (EMA50 - EMA20) / avgCandleBody <= 4,
            // COND_6: () => {
            //   const EMA20last15 = getEMA(
            //     20,
            //     candleStickData.slice(-35).slice(0, 20),
            //   );

            //   return (EMA20last15 - EMA20) / avgCandleBody >= 2;
            // },
          };

          // CONDITION = {}; // debug  ####################################
        } else if (lastestCandle[4] > EMA20) {
          EstRR = (EMA50 / lastestCandle[4] - 1) * 100 * 1;
          type = "down";
          // condition
          CONDITION = {
            COND_1: () => EstRR > 1 && EstRR < 3,
            COND_2: () => checkFullCandle(lastestCandle, "down", avgCandleBody),
            COND_3: () =>
              !candleStickData
                .slice(-15)
                .some((candle) => +candle[2] + avgCandleBody * 1.5 > EMA100),
            COND_4: () =>
              candleStickData.slice(-15).reduce((acc, candle) => {
                if (
                  isUpCandle(candle) &&
                  (candle[4] - candle[1]) /
                    (lastestCandle[1] - lastestCandle[4]) >=
                    1
                ) {
                  return acc + 1;
                }

                return acc;
              }, 0) <= 1,
          };
          CONDITION = {}; // debug  ####################################
        }
      } else if (EMA20 < EMA50) {
        if (lastestCandle[4] > EMA20) {
          // EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1;
          // type = "up";
          // // condition
          // CONDITION = {
          //   COND_1: () => EstRR > 0.5 && EstRR < 1,
          //   COND_2: () => isUpCandle(lastestCandle),
          // };
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
    keyFn: "pattern_S2",
  };
};
