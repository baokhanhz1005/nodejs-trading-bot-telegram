import {
  checkTrendingLine,
  countContinueDow,
  countContinueUp,
  exchangePrice,
  findContinueSameTypeCandle,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
  getSmallestFractionPart,
  isDownTrending,
  isUpTrending,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import { CONFIG_QUICK_TRADE } from "./config.js";

const { COST, RR, RATE_SL, limitPeakOrBottom } = CONFIG_QUICK_TRADE;

export const checkAbleQuickOrder = (candleStickData, symbol, typeCheck) => {
  const result = {
    type: "",
    symbol,
    isAbleOrder: false,
    tpPercent: 1,
    slPercent: 1,
    timeStamp: null,
  };

  const newData = { ...result };

  const { type, isAllowOrder, slPercent, timeStamp, entry } = checkPattern(
    candleStickData,
    symbol,
    typeCheck
  );

  if (isAllowOrder) {
    newData.type = type;
    newData.symbol = symbol;
    newData.isAbleOrder = true;
    newData.slPercent = slPercent;
    newData.tpPercent = slPercent * RR;
    newData.timeStamp = timeStamp;
    newData.entry = entry;
  }
  return newData;
};

const checkPattern = (candleStickData, symbol, typeCheck) => {
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

  const threeLatestCandle = candleStickData.slice(-3);

  // trending
  const closePrices = candleStickData.map((candle) => parseFloat(candle[4]));

  // list peak
  const listHighest = getListHighest(candleStickData, limitPeakOrBottom);
  const listHighestValue = listHighest.map((peak) => +peak.price);
  const lastestPeakPrice = listHighestValue.slice(-1)[0];

  // list lowest
  const listLowest = getListLowest(candleStickData, limitPeakOrBottom);
  const listLowestValue = listLowest.map((candle) => +candle.price);
  const lastestLowestPrice = listLowestValue.slice(-1)[0];

  const isUpTrend = isUpTrending(listHighestValue);
  // && lastestCandle[4] * 1.015 > lastestLowestPrice;
  const isDownTrend = isDownTrending(listLowestValue);
  // && lastestCandle[4] * 0.985 < lastestPeakPrice;
  const limit = 11;
  const rangeCandle10 = candleStickData.slice(-5);
  const rangeCandle15 = candleStickData.slice(-15);
  const rangeCandle30 = candleStickData.slice(-30);
  const rangeCandle50 = candleStickData.slice(-50);
  const rangeCandle75 = candleStickData.slice(-75);
  const maxRange15 = getMaxOnListCandle(rangeCandle15, 4);
  const minRange15 = getMinOnListCandle(rangeCandle15, 4);

  const maxRange30 = getMaxOnListCandle(rangeCandle30, 4);
  const minRange30 = getMinOnListCandle(rangeCandle30, 4);

  const maxRange50 = getMaxOnListCandle(rangeCandle50, 2);
  const minRange50 = getMinOnListCandle(rangeCandle50, 3);

  const minRange75 = getMinOnListCandle(rangeCandle75, 4);
  const maxRange75 = getMaxOnListCandle(rangeCandle75, 4);

  const minRange75Info = getMinOnListCandle(rangeCandle75, 4, 1);
  const maxRange75Info = getMaxOnListCandle(rangeCandle75, 4, 1);

  const maxRange150 = getMaxOnListCandle(candleStickData, 4);
  const minRange150 = getMinOnListCandle(candleStickData, 4);

  const minimumFractionalPart = getSmallestFractionPart(lastestCandle[4]);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    rangeCandle50,
    minimumFractionalPart
  );

  const min3Range15 = getMinOnListCandle(rangeCandle15, 3);
  const max2Range15 = getMaxOnListCandle(rangeCandle15, 2);

  const trendLine = checkTrendingLine(rangeCandle75);

  if (
    true &&
    (!typeCheck || typeCheck === 1) &&
    isUpCandle(lastestCandle, "up")
  ) {
    const EstRR = (lastestCandle[4] / thirdLastCandle[3] - 1) * 100 * RATE_SL;

    // condition
    const CONDITION = {
      COND_1: () => EstRR > 1 && EstRR < 1.5,
      COND_2: () =>
        // isUpCandle(thirdLastCandle) &&
        lastestCandle[3] - thirdLastCandle[2] > 0 &&
        (lastestCandle[3] - thirdLastCandle[2]) / exchangePrice(prevCandle) >
          0.75,
      COND_3: () => trendLine === "up",
      COND_4: () => countContinueDow(rangeCandle30) <= 4,
      COND_5: () =>
        !rangeCandle15.some(
          (candle) =>
            isDownCandle(candle) &&
            exchangePrice(candle) > lastestCandle[4] - thirdLastCandle[3]
        ),
      // COND_6: () =>
      //   (maxRange30 / minRange30 - 1) /
      //     (lastestCandle[4] / thirdLastCandle[3] - 1) >=
      //   3,
    };

    const isPassCondition = Object.values(CONDITION).every((cond) => cond());

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "up";
      isAllowOrder = true;

      timeStamp = lastestCandle[0];
    }
  } else if (
    true &&
    (!typeCheck || typeCheck === 2) &&
    isDownCandle(lastestCandle, "down")
  ) {
    const EstRR = (thirdLastCandle[2] / lastestCandle[4] - 1) * 100 * RATE_SL;

    // condition
    const CONDITION = {
      COND_1: () => EstRR > 1 && EstRR < 1.5,
      COND_2: () =>
        // isDownCandle(thirdLastCandle) &&
        thirdLastCandle[3] - lastestCandle[2] > 0 &&
        (thirdLastCandle[3] - lastestCandle[2]) / exchangePrice(prevCandle) >
          0.75,
      COND_3: () => trendLine === "down",
      COND_4: () => countContinueUp(rangeCandle30) <= 4,
      // COND_5: () =>
      //   !rangeCandle15.some(
      //     (candle) =>
      //       isUpCandle(candle) &&
      //       exchangePrice(candle) > thirdLastCandle[2] - lastestCandle[4]
      //   ),
    };

    const isPassCondition = Object.values(CONDITION).every((cond) => cond());

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "down";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  }

  return { type, slPercent, isAllowOrder, timeStamp, entry: lastestCandle[4] };
};
