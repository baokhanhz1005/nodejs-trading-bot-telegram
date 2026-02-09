import {
  findContinueSameTypeCandle,
  getEMA,
  getListHighest,
  getMaxOnListCandle,
  getMinOnListCandle,
  isUpTrending,
} from "../../../../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isUpCandle,
} from "../../../../../../utils/TypeCandle.js";

export const checkPattern_6 = (candleStickData, symbol, typeCheck) => {
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

  EstRR = (lastestCandle[4] / prevCandle[3] - 1) * 100 * 1;

  // const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
  // const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

  //   const { maxContinueDown } = findContinueSameTypeCandle(
  //     candleStickData.slice(-15)
  //   );
  const limitPeakOrBottom = 100;

  const listHighest = getListHighest(
    candleStickData.slice(-limitPeakOrBottom),
    8,
    2,
  );

  const listHighestValue = listHighest.map((p) => p.price);

  const isUpTrend = isUpTrending(listHighestValue);

  // condition
  CONDITION = {
    COND_1: () => EstRR > 0.6 && EstRR < 1,
    COND_2: () => isUpCandle(lastestCandle, "up"),
    COND_3: () =>
      lastestCandle[4] > thirdLastCandle[1] &&
      isDownCandle(thirdLastCandle) &&
      prevCandle[4] < thirdLastCandle[1] &&
      isUpCandle(prevCandle),
    COND_4: () =>
      lastestCandle[4] > EMA200 ||
      !candleStickData.slice(-50).some((candle) => candle[4] > EMA200),
    COND_5: () => isUpTrend,
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
    keyFn: "pattern_L6",
  };
};
