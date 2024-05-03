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
    signalPeriod: 4,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };

  // const macdInput = {
  //     values: closePrices,
  //     fastPeriod: 12,
  //     slowPeriod: 26,
  //     signalPeriod: 9,
  //     SimpleMAOscillator: false,
  //     SimpleMASignal: false,
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
  if (true && lastMacd > lastSignal * 0.7) {
    trend = "Trending Up";
    // const rangeCandle50 = candleStickData.slice(-50);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    // const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);
    // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
    const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
    const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);

    const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
      candleStickData.slice(-25)
    );

    const preCondition1 =
      checkFullCandle(prevCandle, "down") && checkPinbar(lastestCandle, "up");

    const preCondition2 =
      checkFullCandle(prevCandle, "down") &&
      checkFullCandle(lastestCandle, "up") &&
      lastestCandle[4] * 0.999 > prevCandle[1] &&
      lastestCandle[2] < maxRange50 * 0.97;

    if (true && (preCondition1 || preCondition2)) {
      const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 2.5;
      const CONDITION_2__ = EstRR > 0.7 && EstRR < 1.4;
      const CONDITION_1__ = +minRange50 === +min3Range10;
      const CONDITION_3__ =
        (lastestCandle[2] - minRange50) /
          (lastestCandle[2] - lastestCandle[3]) <
        3;
      if (CONDITION_1__ && CONDITION_2__ && CONDITION_3__) {
        slPercent = EstRR;
        type = "up";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    } else if (
      true &&
      (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up"))
    ) {
      const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 2.5;
      const CONDITION_2__ = EstRR > 0.7 && EstRR < 1.4;
      const CONDITION_3__ =
        candleStickData.slice(-40)[0][4] / lastestCandle[4] < 0.98;
      const CONDITION_4__ = candleStickData[0][4] / lastestCandle[4] > 0.95;
      if (true && CONDITION_2__ && CONDITION_3__ && CONDITION_4__) {
        slPercent = EstRR;
        type = "up";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    }
  } else if (true && lastMacd < lastSignal * 0.7) {
    trend = "Trending Down";
    // const rangeCandle50 = candleStickData.slice(-50);
    // const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
    // const minRange45 = getMinOnListCandle(rangeCandle50.slice(0, 45), 3);
    const min4Range15 = getMinOnListCandle(candleStickData.slice(-15), 4);
    const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
    const max2Rang10 = getMaxOnListCandle(candleStickData.slice(-10), 2);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    // const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
    // const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    //     candleStickData.slice(-25)
    // );
    const preCondition1 =
      isUpCandle(prevCandle, "up") &&
      checkFullCandle(lastestCandle, "down") &&
      lastestCandle[4] < prevCandle[1] * 0.998;

    // const preCondition2 =
    //   checkPinbar(forthLastCandle, "down") &&
    //   checkPinbar(thirdLastCandle, "down") &&
    //   checkPinbar(prevCandle, "down") &&
    //   checkPinbar(lastestCandle, "down");

    if (true && (preCondition1 || false)) {
      const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 2.5;
      const CONDITION_2__ = EstRR > 0.7 && EstRR < 1.4;
      const CONDITION_1__ = +max2Rang10 === +maxRange50;
      const CONDITION_3__ =
        (maxRange50 - lastestCandle[3]) /
          (lastestCandle[2] - lastestCandle[3]) <
        3;
      if (true && CONDITION_1__ && CONDITION_2__ && CONDITION_3__) {
        slPercent = EstRR;
        type = "down";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    } else if (
      true &&
      (checkFullCandle(lastestCandle, "down") ||
        checkPinbar(lastestCandle, "down"))
    ) {
      const indexMin = candleStickData
        .slice(-15)
        .findIndex((candle) => +candle[4] === +min4Range15);
      const indexMax = candleStickData
        .slice(-15)
        .findIndex((candle) => +candle[4] === +max4Range15);
      if (indexMin < limit) {
        const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 2.5;
        // const CONDITION_1__ = lastestCandle[4] / min4Range15 < 1.004;
        const CONDITION_2__ = EstRR > 0.7 && EstRR < 1.4;
        // const CONDITION_3__ = candleStickData[0][4] / lastestCandle[4] > 1.005;
        const CONDITION_4__ =
          candleStickData.slice(-40)[0][4] / lastestCandle[4] > 1.01;
        if (true && CONDITION_2__ && CONDITION_4__) {
          slPercent = EstRR;
          type = "down";
          isAllowOrder = true;
          timeStamp = lastestCandle[0];
        }
      }
    }
  } else {
    trend = "No Significant Trend";
  }

  return { type, slPercent, isAllowOrder, timeStamp };
};
