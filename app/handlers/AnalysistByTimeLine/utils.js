import {
  checkFullCandle,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import {
  checkCurrentTrending,
  findContinueSameTypeCandle,
  forecastTrending,
  getMaxOnListCandle,
  getMinOnListCandle,
  rateUpAndDown,
} from "../../../utils/handleDataCandle.js";
import { RR } from "../../execute/ExecuteSMC/constant.js";
import { MACD } from "technicalindicators";

export const checkIsAbleOrder = (candleStickData, symbol) => {
  const result = {
    type: "",
    symbol,
    isAbleOrder: false,
    tpPercent: 1,
    slPercent: 1,
    timeStamp: null,
  };

  const newData = { ...result };

  const { type, isAllowOrder, slPercent, timeStamp } = checkPattern(
    candleStickData,
    symbol
  );

  if (isAllowOrder) {
    newData.type = type;
    newData.symbol = symbol;
    newData.isAbleOrder = true;
    newData.slPercent = slPercent;
    newData.tpPercent = slPercent * RR;
    newData.timeStamp = timeStamp;
  }
  return newData;
};

const checkPattern = (candleStickData, symbol) => {
  //   const count = candleStickData.length;
  const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
    candleStickData.slice(-4);
  //   const max = Math.max(
  //     ...candleStickData.slice(-50).map((candle) => parseFloat(candle[2]))
  //   );
  //   const min = Math.min(
  //     ...candleStickData.slice(-50).map((candle) => parseFloat(candle[3]))
  //   );

  let type = "";
  let isAllowOrder = false;
  let slPercent = 1;
  let timeStamp = "";

  if (
    candleStickData &&
    candleStickData.length &&
    candleStickData.slice(-50).some((candle) => candle[2] / candle[3] > 1.05)
  ) {
    return { type, slPercent, isAllowOrder };
  }

  let trend;
  trend = "Trending Up";
  // const rangeCandle50 = candleStickData.slice(-50);
  const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
  const maxRangeAll = getMaxOnListCandle(candleStickData, 2);
  // const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
  const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
  const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
  const minRange25 = getMinOnListCandle(candleStickData.slice(-25), 3);
  const maxRange25 = getMaxOnListCandle(candleStickData.slice(-25), 2);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    candleStickData.slice(-25)
  );

  if (
    true &&
    [
      checkFullCandle(lastestCandle, "up") &&
        isDownCandle(prevCandle) &&
        lastestCandle[4] > prevCandle[1],
      false,
    ].some((condition) => !!condition)
  ) {
    const EstRR = (lastestCandle[4] / minRange25 - 1) * 100 * 1.2;
    // condition
    const isPassCondition = [
      EstRR > 0.25 && EstRR < 0.8,
      lastestCandle[4] / lastestCandle[1] < 1.0035,
    ].every((cond) => !!cond);

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "up";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  } else if (
    true &&
    [
      checkFullCandle(lastestCandle, "down") &&
        isUpCandle(prevCandle) &&
        lastestCandle[4] < prevCandle[1],
      false,
    ].some((condition) => !!condition)
  ) {
    const EstRR = (maxRange25 / lastestCandle[4] - 1) * 100 * 1.2;
    // condition
    const isPassCondition = [
      EstRR > 0.25 && EstRR < 0.8,
      lastestCandle[1] / lastestCandle[4] < 1.0035,
    ].every((cond) => !!cond);

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "down";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  }

  return { type, slPercent, isAllowOrder, timeStamp };
};
