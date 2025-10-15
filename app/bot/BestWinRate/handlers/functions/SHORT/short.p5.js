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

export const checkPattern_5 = (candleStickData, symbol, typeCheck) => {
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

  EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.25;

  const EMA200 = getEMA(200, candleStickData.slice(-200));
  // const EMA20 = getEMA(20, candleStickData.slice(-20));

  // const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
//   const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);
  const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);

  // const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
  //   candleStickData.slice(-15)
  // );
  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.6 && EstRR < 1,
    COND_2: () => checkFullCandle(lastestCandle, "down"),
    COND_3: () =>
      (lastestCandle[4] - min3Range30) /
        (lastestCandle[1] - lastestCandle[4]) >=
      2,
    COND_4: () =>
      Math.abs(EMA200 - lastestCandle[4]) /
        (lastestCandle[1] - lastestCandle[4]) >=
      1.5,
    COND_5: () =>
      lastestCandle[4] > EMA200 ||
      !candleStickData.slice(-30).some((candle) => candle[4] > EMA200),
    // COND_6: () => isUpCandle(prevCandle),
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
    keyFn: "pattern_S5",
  };
};
