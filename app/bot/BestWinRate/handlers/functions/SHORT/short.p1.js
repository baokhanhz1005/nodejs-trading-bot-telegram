import {
  findContinueSameTypeCandle,
  getEMA,
  getMaxOnListCandle,
  getMinOnListCandle,
} from "../../../../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
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
  let currentRR = 0.5;
  let EstRR = 1;

  const EMA100 = getEMA(100, candleStickData.slice(-100));
  const EMA50 = getEMA(50, candleStickData.slice(-50));
  const EMA20 = getEMA(20, candleStickData.slice(-20));

  const min3Range15 = getMinOnListCandle(candleStickData.slice(-15), 3);
  const max3Range15 = getMaxOnListCandle(candleStickData.slice(-15), 3);

  const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

  const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
  const min4Range50 = getMinOnListCandle(candleStickData.slice(-50), 4);

  const avgCandleBody =
    candleStickData.slice(-50).reduce((acc, candle) => {
      return (acc += Math.abs(+candle[1] - +candle[4]));
    }, 0) / 50;
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
    candleStickData.slice(-15),
  );

  const RANGE_EXCHANGE_LEVEL = (max4Range50 - min4Range50) / avgCandleBody;

  if (RANGE_EXCHANGE_LEVEL > 17) {
    if (EMA20 > EMA50 && lastestCandle[4] > EMA20) {
      // LONG
      EstRR = (lastestCandle[4] / prevCandle[3] - 1) * 100 * 1;
      type = "up";
      // condition
      CONDITION = {
        COND_1: () => EstRR > 0.6 && EstRR < 1.5,
        COND_2: () =>
          checkFullCandle(prevCandle, "up", avgCandleBody) &&
          isUpCandle(lastestCandle),
        COND_3: () =>
          (lastestCandle[3] - EMA20) / (lastestCandle[4] - prevCandle[3]) <= 0.5,
      };
    } else if (
      lastestCandle[4] > EMA50 &&
      candleStickData.slice(-30)[0][4] < EMA50 &&
      lastestCandle[4] < EMA20 &&
      true
    ) {
      // SHORT
      EstRR = (prevCandle[2] / lastestCandle[4] - 1) * 100 * 1.5;
      type = "down";
      // condition
      CONDITION = {
        COND_1: () => EstRR > 0.6 && EstRR < 1.5,
        COND_2: () =>
          checkFullCandle(prevCandle, "down", avgCandleBody) &&
          isDownCandle(lastestCandle),
        COND_3: () => lastestCandle[4] < thirdLastCandle[3],
        COND_4: () =>
          lastestCandle[4] > EMA50 && candleStickData.slice(-30)[0][4] < EMA50,
        COND_5: () =>
          !candleStickData
            .slice(-30)
            .some(
              (candle) =>
                checkFullCandle(candle, "up", avgCandleBody) &&
                (candle[4] - candle[1]) / (prevCandle[2] - lastestCandle[4]) >=
                  1.5,
            ),
      };
    }
  }

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
