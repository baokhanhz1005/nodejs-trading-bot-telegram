import {
  findContinueSameTypeCandle,
  getEMA,
  getMaxOnListCandle,
  getMinOnListCandle,
} from "../../../../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
} from "../../../../../../utils/TypeCandle.js";

export const checkPattern_3 = (candleStickData, symbol, typeCheck) => {
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
  const EMA20 = getEMA(20, candleStickData.slice(-20));

  EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 2;

  const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
  const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

  const { maxContinueDown } = findContinueSameTypeCandle(
    candleStickData.slice(-15)
  );
  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.7 && EstRR < 1,
    COND_2: () => checkFullCandle(lastestCandle, "up"),
    COND_3: () => isDownCandle(prevCandle) && lastestCandle[4] > prevCandle[1],
    COND_4: () => maxContinueDown <= 4,
    COND_5: () =>
      !candleStickData
        .slice(-15)
        .some(
          (candle) =>
            isDownCandle(candle) &&
            Math.abs(candle[1] - candle[3]) /
              (lastestCandle[4] - lastestCandle[3]) >=
              1.5
        ),
    COND_6: () =>
      Math.abs(EMA200 - EMA20) / (lastestCandle[4] - lastestCandle[3]) >= 1.5,
  };

  const isPassCondition =
    Object.values(CONDITION).length &&
    Object.values(CONDITION).every((cond) => cond());

  if (isPassCondition) {
    slPercent = EstRR;
    tpPercent = EstRR * currentRR;
    type = "up";
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
    keyFn: "pattern_L3",
  };
};
