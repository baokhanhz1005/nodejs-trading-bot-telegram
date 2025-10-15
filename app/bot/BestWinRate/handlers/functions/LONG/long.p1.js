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
  let currentRR = 1;
  let EstRR = 1;

  const EMA200 = getEMA(200, candleStickData.slice(-200));

  EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 2;

  const min4Range15 = getMinOnListCandle(candleStickData.slice(-15), 4);
  const max5Range15 = getMaxOnListCandle(candleStickData.slice(-15), 5);

  // const { maxContinueDown } = findContinueSameTypeCandle(
  //   candleStickData.slice(-15)
  // );
  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.5 && EstRR < 0.9,
    COND_2: () => isUpCandle(lastestCandle, "up"),
    COND_3: () => +lastestCandle[5] === max5Range15,
    COND_4: () => +min4Range15 === +lastestCandle[4],
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
    keyFn: "pattern_L1",
  };
};
