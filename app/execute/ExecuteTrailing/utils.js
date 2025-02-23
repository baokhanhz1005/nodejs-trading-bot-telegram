import {
  findContinueSameTypeCandle,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
  isDownTrending,
  isUpTrending,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import { CONFIG } from "./configs.js";

const result = {
  type: "",
  isAbleOrder: false,
  tpPercent: 1,
  slPercent: 1,
  timeStamp: null,
};

export const initMarkInfo = () => ({
  isMarked: false,
  markType: "",
  data: {
    slPrice: "",
    countUnexpect: 0,
    timeStamp: "",
  },
});

export const checkAbleOrderTrailing = (
  candleStickData,
  markInfoPayload = {}
) => {
  const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
    candleStickData.slice(-4);

  const {
    limitUnexpect,
    limitMaxPercentOrder,
    limitMinPercentOrder,
    limitPeakOrBottom,
    gapPercent,
  } = CONFIG;

  const { isMarked, markType, markPrice, data = {} } = markInfoPayload;
  const { countUnexpect = 0, slPrice } = data;
  if (isMarked) {
    const isUp = isUpCandle(lastestCandle);

    let type = "";
    let entry = "";
    let slPercent = "";
    let markInfo = null;
    let timeStamp = "";

    const data = {
      type: "",
      isAbleOrder: false,
      slPercent: "",
      entry: "",
      markInfo: initMarkInfo(),
    };

    const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
      candleStickData.slice(-limitUnexpect)
    );

    if (markType === "up") {
      const sl = (lastestCandle[4] / slPrice - 1) * 100;
      if (isUp) {
        if (
          sl < limitMaxPercentOrder &&
          sl > limitMinPercentOrder &&
          (checkFullCandle(lastestCandle, "up") ||
            !checkPinbar(lastestCandle, "down")) &&
          maxContinueDown <= 3 &&
          markPrice >= lastestCandle[4]
        ) {
          // handle order
          type = "up";
          entry = lastestCandle[4];
          slPercent = sl;
          timeStamp = lastestCandle[0];
        }
      } else if (countUnexpect < limitUnexpect) {
        markInfo = {
          isMarked,
          markType,
          data: {
            ...markInfoPayload.data,
            countUnexpect: countUnexpect + 1,
          },
        };
      }
    } else if (markType === "down") {
      const sl = (slPrice / lastestCandle[4] - 1) * 100;
      if (!isUp) {
        const IS_PASS_CONDITION = [
          sl < limitMaxPercentOrder,
          sl > limitMinPercentOrder,
          checkFullCandle(lastestCandle, "down") ||
            !checkPinbar(lastestCandle, "up"),
          maxContinueUp <= 3,
          lastestCandle[4] / candleStickData.slice(-(countUnexpect + 2))[0][4] <
            1.005,
          lastestCandle[4] >= markPrice,
        ].every((cond) => cond);

        if (IS_PASS_CONDITION) {
          type = "down";
          entry = lastestCandle[4];
          slPercent = sl;
          timeStamp = lastestCandle[0];
        }
      } else if (countUnexpect < limitUnexpect) {
        markInfo = {
          isMarked,
          markType,
          data: {
            ...markInfoPayload.data,
            countUnexpect: countUnexpect + 1,
          },
        };
      }
    }

    if (type) {
      data.isAbleOrder = true;
      data.type = type;
      data.entry = entry;
      data.slPercent = slPercent;
      data.timeStamp = markInfoPayload.data.timeStamp;
      data.countUnexpect = countUnexpect;
    }

    data.markInfo = markInfo ?? initMarkInfo();

    return data;
  } else {
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

    const rangeCandle15 = candleStickData.slice(-15);
    const rangeCandle30 = candleStickData.slice(-30);

    const maxRange15 = getMaxOnListCandle(rangeCandle15, 4);
    const minRange15 = getMinOnListCandle(rangeCandle15, 4);

    const maxRange30 = getMaxOnListCandle(rangeCandle30, 4);

    const { maxContinueUp, maxContinueDown } =
      findContinueSameTypeCandle(rangeCandle30);

    const data = {
      isMarked: false,
      markType: "",
      data: null,
    };

    let type = "";
    let infoMark = {};

    const CHECK_CONDITION = (type) => {
      switch (type) {
        case "up": {
          const checkContinueDownCandle = (candleData, limit) => {
            let countDown = 0;
            return (
              candleData.reduce((acc, candle) => {
                if (isDownCandle(candle)) {
                  countDown += 1;
                } else {
                  if (countDown > acc) {
                    const newCount = countDown;
                    countDown = 0;
                    return newCount;
                  }
                  countDown = 0;
                }

                return acc;
              }, 0) <= limit
            );
          };

          const COND_1 =
            (isUpCandle(prevCandle) && checkFullCandle(lastestCandle, "up")) ||
            (checkFullCandle(prevCandle, "up") && isUpCandle(lastestCandle));
          const COND_2 = lastestCandle[4] / lastestLowestPrice <= 1.025;
          const COND_3 = candleStickData
            .slice(-30)
            .every(
              (candle) =>
                !(
                  checkFullCandle(candle, "down") &&
                  candle[1] / candle[4] > 1.006
                )
            );

          const COND_4 =
            rangeCandle15.reduce((acc, candle, index) => {
              if (index >= 13) return acc;
              const nextCandle = rangeCandle15[index + 1];
              if (
                nextCandle &&
                checkFullCandle(candle, "up") &&
                checkFullCandle(nextCandle, "down") &&
                Math.abs(nextCandle[1] - nextCandle[4]) /
                  Math.abs(candle[1] - candle[4]) >
                  acc
              ) {
                return (
                  Math.abs(nextCandle[1] - nextCandle[4]) /
                  Math.abs(candle[1] - candle[4])
                );
              }

              return acc;
            }, 0) < 1.2;

          const COND_5 = checkContinueDownCandle(candleStickData.slice(-45), 4);

          const COND_6 = lastestCandle[4] >= lastestLowestPrice;

          const COND_7 = lastestCandle[4] / lastestLowestPrice < 1.015;

          const COND_8 =
            lastestPeakPrice < lastestCandle[4]
              ? lastestCandle[4] / lastestPeakPrice < 1.0025
              : true;

          const COND_9 = (() => {
            let count = 0;
            return (
              rangeCandle30.reduce((acc, candle) => {
                if (isDownCandle(candle)) {
                  count += 1;
                } else if (count >= 3) {
                  count = 0;
                  return acc + 1;
                } else {
                  count = 0;
                }

                return acc;
              }, 0) <= 1
            );
          })();

          const COND_10 = (() => {
            let count = 0;
            return (
              candleStickData.slice(0, 50).reduce((acc, candle) => {
                if (isDownCandle(candle)) {
                  count += 1;
                } else if (count >= 5) {
                  return 100;
                } else if (count >= 3) {
                  count = 0;
                  return acc + 1;
                } else {
                  count = 0;
                }

                return acc;
              }, 0) <= 2
            );
          })();

          // !rangeCandle30.some(
          //   (candle, index) =>
          //     index >= 2 &&
          //     isUpCandle(rangeCandle30[index - 1]) &&
          //     isUpCandle(rangeCandle30[index - 2]) &&
          //     checkFullCandle(candle, "down") &&
          //     candle[4] < rangeCandle30[index - 2][1]
          // );

          return [
            COND_1,
            COND_2,
            COND_3,
            COND_4,
            COND_5,
            COND_6,
            COND_7,
            COND_8,
            COND_9,
            // COND_10,
          ].every((cond) => cond);
        }

        case "down": {
          const COND_1 =
            (isDownCandle(prevCandle) &&
              checkFullCandle(lastestCandle, "down")) ||
            (checkFullCandle(prevCandle, "down") &&
              isDownCandle(lastestCandle));

          // có dưới 2 nến tăng full lực
          const COND_2 =
            rangeCandle15.reduce((acc, curr) => {
              if (checkFullCandle(curr, "up")) {
                return acc + 1;
              }
              return acc;
            }, 0) <= 2;

          const COND_3 = candleStickData
            .slice(-30)
            .every(
              (candle) =>
                !(
                  checkFullCandle(candle, "up") && candle[4] / candle[1] > 1.006
                )
            );

          const COND_4 = maxContinueUp <= 4;

          const COND_5 =
            rangeCandle30.reduce((acc, candle, index) => {
              if (index >= rangeCandle30.length - 2) return acc;

              const nextCandle = rangeCandle30[index + 1];
              const thirdNextCandle = rangeCandle30[index + 2];

              if (
                nextCandle &&
                thirdNextCandle &&
                isUpCandle(candle) &&
                isUpCandle(nextCandle) &&
                isUpCandle(thirdNextCandle) &&
                thirdNextCandle[4] / candle[1] > acc
              ) {
                return thirdNextCandle[4] / candle[1];
              }

              return acc;
            }, 0) < 1.01;

          const COND_6 = lastestPeakPrice / lastestCandle[4] < 1.02;
          const COND_7 =
            !rangeCandle15.reduce((acc, candle, index) => {
              if (index >= 13) return acc;
              const nextCandle = rangeCandle15[index + 1];
              if (
                nextCandle &&
                isDownCandle(candle) &&
                checkFullCandle(nextCandle, "up") &&
                Math.abs(nextCandle[1] - nextCandle[4]) /
                  Math.abs(candle[1] - candle[4]) >
                  acc
              ) {
                return (
                  Math.abs(nextCandle[1] - nextCandle[4]) /
                  Math.abs(candle[1] - candle[4])
                );
              }

              return acc;
            }, 0) < 1.2;

          const COND_8 =
            candleStickData.slice(-50)[0][4] / lastestCandle[4] < 1.03;

          const COND_9 = (() => {
            let count = 0;
            let entry = 0;
            return (
              candleStickData.slice(-50).reduce((acc, candle, index) => {
                if (isUpCandle(candle)) {
                  count += 1;

                  if (!entry) {
                    entry = candle[1];
                  }
                } else if (count >= 2) {
                  const percent =
                    candleStickData.slice(-50)[index - 1][4] / entry;
                  count = 0;
                  entry = 0;

                  if (acc < percent) {
                    return percent;
                  }
                } else {
                  entry = 0;
                  count = 0;
                }

                return acc;
              }, 0) <= 1.0125
            );
          })();

          return [
            COND_1,
            COND_2,
            COND_3,
            COND_4,
            COND_5,
            COND_6,
            COND_7,
            COND_8,
            COND_9,
          ].every((cond) => cond);
        }

        default:
          return false;
      }
    };

    if (CHECK_CONDITION("up")) {
      const slPrice = prevCandle[3] * (1 - gapPercent / 100);

      type = "up";
      infoMark = {
        slPrice,
        countUnexpect: 0,
        timeStamp: lastestCandle[0],
      };
    } else if (CHECK_CONDITION("down")) {
      const slPrice = prevCandle[2] * (1 + gapPercent / 100);

      type = "down";
      infoMark = {
        slPrice,
        countUnexpect: 0,
        timeStamp: lastestCandle[0],
      };
    }

    if (type) {
      data.isMarked = true;
      data.markType = type;
      data.markPrice = lastestCandle[4];
      data.data = infoMark;
    }

    return data;
  }
};
