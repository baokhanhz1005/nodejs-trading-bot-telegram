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
import { REWARD, RR, LIMIT_ORDER } from "../ExecuteSMC/constant.js";
import { MACD } from "technicalindicators";

export const checkAbleOrderBySympleMethod = (candleStickData, symbol) => {
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

  // trending
  const closePrices = candleStickData.map((candle) => parseFloat(candle[4]));

  // list peak
  const listHighest = getListHighest(candleStickData, 10);
  const listHighestValue = listHighest.map((peak) => +peak.price);
  const lastestPeakPrice = listHighestValue.slice(-1)[0];

  // list lowest
  const listLowest = getListLowest(candleStickData, 10);
  const listLowestValue = listLowest.map((candle) => +candle.price);
  const lastestLowestPrice = listLowestValue.slice(-1)[0];

  const isUpTrend = isUpTrending(listHighestValue);
  // && lastestCandle[4] * 1.015 > lastestLowestPrice;
  const isDownTrend = isDownTrending(listLowestValue);
  // && lastestCandle[4] * 0.985 < lastestPeakPrice;
  const limit = 11;

  let trend;

  trend = "Trending Up";
  // const rangeCandle50 = candleStickData.slice(-50);
  // const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
  // const maxRangeAll = getMaxOnListCandle(candleStickData, 2);
  // // const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);
  // // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
  // const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
  // const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    candleStickData.slice(-25)
  );

  if (
    true &&
    isUpTrend &&
    // isUpCandle(lastestCandle)
    checkFullCandle(prevCandle, "up")
  ) {
    // const EstRR = (lastestCandle[4] / prevCandle[3] - 1) * 100 * 1.5;

    // ////////
    const EstRR1 = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 2;
    const EstRR2 = (lastestCandle[4] / prevCandle[3] - 1) * 100 * 2;
    const EstRR3 = (lastestCandle[4] / thirdLastCandle[3] - 1) * 100 * 2;

    const EstRR = [EstRR1, EstRR2, EstRR3].reduce((max, currentRR) => {
      if (currentRR > 0.6 && currentRR < 1.667) {
        return max < currentRR ? currentRR : max;
      }
      return max;
    }, EstRR1);
    // ////////

    const { countUp } = rateUpAndDown(candleStickData.slice(-50), 1, false);
    const candleStickRange15 = candleStickData.slice(-15);
    const { countUp: countUpShortTerm } = rateUpAndDown(
      candleStickRange15,
      1,
      false
    );

    // condition
    const isPassCondition = [
      EstRR > 0.65 && EstRR < 1.667,
      lastestCandle[4] < lastestPeakPrice,
      isUpCandle(lastestCandle) ||
        Math.abs(lastestCandle[1] - lastestCandle[4]) /
          Math.abs(prevCandle[1] - prevCandle[4]) <=
          0.6,
      lastestCandle[4] * (1 + EstRR / 100) < lastestPeakPrice * 1.005,
      candleStickData
        .slice(-35)
        .every(
          (candle) =>
            isUpCandle(candle) ||
            (isDownCandle(candle) && candle[1] / candle[4] < 1.02)
        ),
      // maxRangeAll === lastestCandle[2]
      //   ? false
      //   : lastestCandle[4] * 1.05 < maxRangeAll,
      // candleStickData.slice(-50)[0][4] / lastestCandle[4] > 0.97,
      // countUp / candleStickData.slice(-50).length > 0.47,
      // countUpShortTerm / candleStickRange15.length < 0.65,
      // candleStickRange15[0][4] * 0.99 > lastestCandle[4],
      // maxRange50 / lastestCandle[4] < 1.05,
    ].every((cond) => !!cond);

    if (true && isPassCondition) {
      slPercent = EstRR;
      type = "up";
      isAllowOrder = true;
      timeStamp = lastestCandle[0];
    }
  }

  // trend = "Trending Down";

  // const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
  //   candleStickData.slice(-25)
  // );
  else if (
    true &&
    isDownTrend &&
    // isDownCandle(lastestCandle)
    (checkFullCandle(lastestCandle, "down") ||
      checkPinbar(lastestCandle, "down"))
  ) {
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
    const EstRR1 = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 2;
    const EstRR2 = (prevCandle[2] / lastestCandle[4] - 1) * 100 * 2;
    const EstRR3 = (thirdLastCandle[2] / lastestCandle[4] - 1) * 100 * 2;

    const EstRR = [EstRR1, EstRR2, EstRR3].reduce((max, currentRR) => {
      if (currentRR > 0.65 && currentRR < 1.667) {
        return max < currentRR ? currentRR : max;
      }
      return max;
    }, EstRR1);

    const [firstPeak, secondPeak, ...restPeak] = listLowestValue;
    const [prevBottom, lastestBottom] = listLowestValue.slice(-2);

    const { countDown } = rateUpAndDown(candleStickData.slice(-50), 1, false);
    const candleStickRange15 = candleStickData.slice(-15);
    const { countDown: countDownShortTerm } = rateUpAndDown(
      candleStickRange15,
      1,
      false
    );

    const { maxContinueUp, maxContinueDown } =
      findContinueSameTypeCandle(candleStickData);

    const { index, value } = getMinMaxAndIndexOnListCandle(
      candleStickData.slice(-20),
      "max",
      [2]
    );

    const listCandleLatest = candleStickData.slice(-35);
    const maxRange35ClosePrice = getMaxOnListCandle(listCandleLatest, 4);

    const [prevPeak, lastestPeak] = listHighestValue.slice(-2);

    // condition
    const isPassCondition = [
      EstRR > 0.65 && EstRR < 1.667,
      candleStickData
        .slice(-5)
        .every((candle) => candle[4] >= lastestCandle[4]),
      // isDownCandle(prevCandle) || isDownCandle(thirdLastCandle),
      // isUpCandle(prevCandle) ? lastestCandle[4] < prevCandle[1] : true,

      /////////////////
      lastestCandle[4] > lastestBottom,
      // isUpCandle(lastestCandle) ||
      //   Math.abs(lastestCandle[1] - lastestCandle[4]) /
      //     Math.abs(prevCandle[1] - prevCandle[4]) <=
      //     0.6,
      lastestCandle[4] * (1 - EstRR / 100) > lastestBottom * 0.995,
      candleStickData
        .slice(-35)
        .every(
          (candle) =>
            isDownCandle(candle) ||
            (isUpCandle(candle) && candle[4] / candle[1] < 1.02)
        ),

      //////////

      // // lastestCandle[4] * (1 - EstRR / 100) > lastestLowestPrice * 0.995,
      // // candleStickData.slice(-30).every(candle => isUpCandle(candle) || candle[1] / candle[4] <= 1.004),
      // lastestPeakPrice > lastestCandle[4] * 0.995,
      // // lastestCandle[4] * 0.995 < maxRange20ClosePrice,
      // // maxRange20ClosePrice <= lastestPeakPrice,
      // lastestCandle[4] > lastestBottom
      //   ? lastestCandle[4] / lastestBottom < 1.02
      //   : true,
      // maxContinueUp <= 5,
      // firstPeak > secondPeak * 1.005,
      // lastestBottom / prevBottom < 1.018,
      // lastestBottom * 0.995 < prevBottom,
      // prevBottom > lastestBottom
      //   ? prevBottom / lastestBottom >= 1.005
      //     ? true
      //     : lastestCandle[4] * (1 - EstRR / 100) > lastestLowestPrice * 0.995
      //   : false,
      // prevPeak > lastestPeak,
      // candleStickData
      //   .slice(-10)
      //   .every(
      //     (candle) =>
      //       isDownCandle(candle) ||
      //       (checkFullCandle(candle, "up") || checkPinbar(candle, "up")
      //         ? candle[4] / candle[3] <= 1.0075
      //         : true)
      //   ),
      // // maxRange50 / lastestCandle[4] <= 1.025,
      // // candleStickData
      // // .slice(-35)
      // // .every(
      // //   (candle) =>
      // //     isUpCandle(candle) ||
      // //     (isDownCandle(candle) && candle[1] / candle[4] < 1.01)
      // // ),
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
