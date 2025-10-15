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

export const checkPattern_4 = (candleStickData, symbol, typeCheck) => {
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
  // const EMA20 = getEMA(20, candleStickData.slice(-20));

  // const max2Range15 = getMaxOnListCandle(candleStickData.slice(-15), 2);
  // const max2Range50 = getMaxOnListCandle(candleStickData.slice(-50), 2);

  EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.25;

  // const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
  // const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
    candleStickData.slice(-10)
  );

  // const rangeCandle10 = candleStickData.slice(-10);
  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.6 && EstRR < 1,
    COND_2: () => isDownCandle(lastestCandle, "down"),
    COND_3: () =>
      candleStickData
        .slice(-5)
        .reduce((acc, candle) => (isDownCandle(candle) ? acc + 1 : acc), 0) >=
      2,
    COND_4: () => maxContinueDown <= 4,
    COND_5: () =>
      EMA200 < lastestCandle[4] ||
      !candleStickData.slice(-50).some((candle) => candle[4] > EMA200),
    COND_6: () =>
      Math.abs(EMA200 - lastestCandle[4]) /
        (lastestCandle[1] - lastestCandle[4]) <=
      3.5,
  };

  const isPassCondition =
    Object.values(CONDITION).length &&
    Object.values(CONDITION).every((cond) => cond());

  if (isPassCondition) {
    slPercent = EstRR;
    tpPercent = EstRR * currentRR;
    type = "down";
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
    keyFn: "pattern_S4",
  };
};
