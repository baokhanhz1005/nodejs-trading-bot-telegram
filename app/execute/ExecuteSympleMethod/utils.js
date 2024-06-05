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

  // Tính toán chỉ báo MACD
  const macdInput = {
    values: closePrices,
    fastPeriod: 6,
    slowPeriod: 13,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };

  // const macdInput = {
  //   values: closePrices,
  //   fastPeriod: 6,
  //   slowPeriod: 13,
  //   signalPeriod: 4,
  //   SimpleMAOscillator: false,
  //   SimpleMASignal: false,
  // };

  const macdResult = MACD.calculate(macdInput);
  // Lấy giá trị MACD line, Signal line và Histogram
  const macdLine = macdResult.map((result) => result.MACD);
  const signalLine = macdResult.map((result) => result.signal);
  //   const histogram = macdResult.map((result) => result.histogram);

  // Xác định xu hướng dựa trên MACD và Signal line
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const limit = 11;

  let trend;
  if (true && lastMacd > lastSignal * 1.2) {
    trend = "Trending Up";
    // const rangeCandle50 = candleStickData.slice(-50);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    const maxRangeAll = getMaxOnListCandle(candleStickData, 2);
    // const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);
    // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
    const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
    const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);

    const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
      candleStickData.slice(-25)
    );

    if (
      true &&
      isUpCandle(lastestCandle) &&
      lastestCandle[4] / lastestCandle[1] > 1.0035
    ) {
      const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.8;
      const { countUp } = rateUpAndDown(candleStickData.slice(-50), 1, false);
      const candleStickRange15 = candleStickData.slice(-15);
      const { countUp: countUpShortTerm } = rateUpAndDown(
        candleStickRange15,
        1,
        false
      );

      // condition
      const isPassCondition = [
        EstRR > 0.7 && EstRR < 2,
        maxRangeAll === lastestCandle[2]
          ? false
          : lastestCandle[4] * 1.05 < maxRangeAll,
        candleStickData.slice(-50)[0][4] / lastestCandle[4] > 0.97,
        countUp / candleStickData.slice(-50).length > 0.47,
        countUpShortTerm / candleStickRange15.length < 0.65,
        candleStickRange15[0][4] * 0.99 > lastestCandle[4],
        maxRange50 / lastestCandle[4] < 1.05,
      ].every((cond) => !!cond);

      if (true && isPassCondition) {
        slPercent = EstRR;
        type = "up";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    }
  } else if (true && lastMacd < lastSignal * 1.4) {
    trend = "Trending Down";
    const minRangeAll = getMinOnListCandle(candleStickData, 3);
    const minRange15 = getMinOnListCandle(candleStickData.slice(-15), 3);

    const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
      candleStickData.slice(-25)
    );

    if (
      true &&
      isDownCandle(lastestCandle) &&
      lastestCandle[1] / lastestCandle[4] > 1.0035
    ) {
      const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.8;
      const { countDown } = rateUpAndDown(candleStickData.slice(-50), 1, false);
      const candleStickRange15 = candleStickData.slice(-15);
      const { countDown: countDownShortTerm } = rateUpAndDown(
        candleStickRange15,
        1,
        false
      );

      // condition
      const isPassCondition = [
        EstRR > 0.7 && EstRR < 2,
        minRangeAll === lastestCandle[3]
          ? false
          : lastestCandle[4] * 0.95 > minRangeAll,
        candleStickData.slice(-50)[0][4] / lastestCandle[4] < 0.985,
        // countDown / 50 > 0.5,
        countDownShortTerm / candleStickRange15.length < 0.6,
        candleStickRange15[0][4] * 0.99 < lastestCandle[4],
        lastestCandle[4] / minRange15 < 1.025,
        candleStickData[0][4] / lastestCandle[4] > 0.975,
        maxContinueUp <= 5,
        minRangeAll / lastestCandle[4] > 0.94,
      ].every((cond) => !!cond);
      if (true && isPassCondition) {
        slPercent = EstRR;
        type = "down";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    }
  } else {
    trend = "No Significant Trend";
  }

  return { type, slPercent, isAllowOrder, timeStamp };
};
