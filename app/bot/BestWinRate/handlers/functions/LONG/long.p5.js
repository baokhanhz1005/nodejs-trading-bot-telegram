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

//   const EMA200 = getEMA(200, candleStickData.slice(-200));
//   const EMA20 = getEMA(20, candleStickData.slice(-20));

//   const min3Range5 = getMinOnListCandle(candleStickData.slice(-5), 3);

  EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.1;

//   const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);

//   const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
//   const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);

//   const { maxContinueDown } = findContinueSameTypeCandle(
//     candleStickData.slice(-10)
//   );
  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.6 && EstRR < 1,
    COND_2: () => isUpCandle(lastestCandle),
    COND_3: () =>
      (lastestCandle[4] - lastestCandle[1]) / (prevCandle[1] - prevCandle[4]) >=
      0.5,
    COND_4: () =>
      !candleStickData
        .slice(-10)
        .some(
          (candle) =>
            isDownCandle(candle) &&
            (candle[1] - candle[4]) / (lastestCandle[4] - prevCandle[3]) >= 1
        ),
    COND_5: () =>
      (lastestCandle[4] - prevCandle[1]) /
        (lastestCandle[4] - lastestCandle[1]) <=
      0.5,
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
    keyFn: "pattern_L5",
  };
};
