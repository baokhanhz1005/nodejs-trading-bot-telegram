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
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinMaxAndIndexOnListCandle,
  getMinOnListCandle,
  isDownTrending,
  isUpTrending,
  rateUpAndDown,
} from "../../../utils/handleDataCandle.js";
import { MACD } from "technicalindicators";
import { INPUT_CONTROL } from "./constant.js";

// configure
const {
  methodFn: { rate },
  REWARD,
  RR,
  limitPeakOrBottom,
} = INPUT_CONTROL;

export const checkAbleOrderBySympleMethodM1 = (
  candleStickData,
  symbol,
  trending = ""
) => {
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
    symbol,
    trending
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

const checkPattern = (candleStickData, symbol, trending) => {
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

  let currentTrend = trending;

  if (!currentTrend) {
    currentTrend = isUpTrend ? "up" : isDownTrend ? "down" : "";
  }

  if (true && isUpTrend && isUpCandle(lastestCandle)) {
    const EstRR = (lastestCandle[4] / prevCandle[3] - 1) * 100 * rate;

    const { countUp } = rateUpAndDown(candleStickData.slice(-50), 1, false);
    const candleStickRange15 = candleStickData.slice(-15);
    const { countUp: countUpShortTerm } = rateUpAndDown(
      candleStickRange15,
      1,
      false
    );

    // condition
    const isPassCondition = [EstRR > 0.5 && EstRR < 1].every(
      (cond) => !!cond
    );

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "up";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  } else if (true && isDownTrend && isDownCandle(lastestCandle)) {
    const EstRR = (lastestCandle[2] / prevCandle[4] - 1) * 100 * rate;

    // condition
    const isPassCondition = [EstRR > 0.5 && EstRR < 1].every(
      (cond) => !!cond
    );
    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "down";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  }

  return { type, slPercent, isAllowOrder, timeStamp };
};
