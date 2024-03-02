import {
  checkFullCandle,
  checkInRange,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import {
  checkTrendLine,
  getMinMaxRangePeriod,
} from "../../../utils/handleDataCandle.js";

export const checkAvailableOrder = (candleStickData, symbol) => {
  let isAbleOrder = false;
  const candleCheck = candleStickData[0];
  const { type, isHasPattern, model } = detectPattern(
    candleCheck,
    candleStickData[1]
  );

  if (isHasPattern) {
    switch (type) {
      case "up":
        let maxBiggerPriceHistory = 0;
        let minPriceHistory = 0;
        let limit = 10;
        while (!maxBiggerPriceHistory) {
          let maxTemp = 0;
          let indexTempMax = 0;
          let minTemp = candleStickData[0][3];
          for (let i = 0; i < limit; i++) {
            const max = candleStickData[i][2];
            const min = candleStickData[i][3];
            if (max >= maxTemp) {
              maxTemp = max;
              indexTempMax = i;
            }
            if (min <= minTemp) {
              minTemp = min;
            }
          }
          if (indexTempMax <= limit - 3 && indexTempMax >= 3) {
            maxBiggerPriceHistory = maxTemp;
            minPriceHistory = minTemp;
          } else if (limit < 60) {
            limit += 10;
          } else {
            break;
          }
        }
        if (
          maxBiggerPriceHistory &&
          candleCheck[4] * 1.011 <= maxBiggerPriceHistory &&
          candleCheck[4] <= 1.0022 * minPriceHistory &&
          candleCheck[4] >= 0.9978 * minPriceHistory
        ) {
          isAbleOrder = true;
        }

        break;

      case "down":
        let maxLowestPriceHistory = 0;
        let limitCheck = 10;

        while (!maxLowestPriceHistory) {
          let minTemp = candleStickData[0][3];
          for (let i = 0; i < limitCheck; i++) {
            const min = candleStickData[i][3];
            if (min <= minTemp) {
              minTemp = min;
            }
          }
          if (candleCheck[4] * 0.985 >= minTemp) {
            maxLowestPriceHistory = minTemp;
          } else if (limit < 60) {
            limit += 10;
          } else {
            break;
          }
        }
        if (maxLowestPriceHistory) {
          isAbleOrder = true;
        }

        break;
      default:
        break;
    }
  }
  return { isAbleOrder, type, symbol, model };
};

export const checkAvailableOrderV2 = (candleStickData, symbol) => {
  let isAbleOrder = false;
  let trendSymbol = "";
  let modelTrend = "";
  const {
    type,
    isHasPattern,
    model: modelPattern,
    skipCheckTrendLine = false,
  } = detectPattern(candleStickData);

  if (isHasPattern) {
    if (skipCheckTrendLine) {
      isAbleOrder = true;
    } else {
      const { trend, model, listMin } = checkTrendLine(candleStickData);
      trendSymbol = trend;
      modelTrend = model;
      if (trend === "side-way") {
        switch (modelPattern) {
          case "up":
            let maxBiggerPriceHistory = 0;
            let minPriceHistory = 0;
            let limit = 10;
            while (!maxBiggerPriceHistory) {
              let maxTemp = 0;
              let indexTempMax = 0;
              let minTemp = candleStickData[0][3];
              for (let i = 0; i < limit; i++) {
                const max = candleStickData[i][2];
                const min = candleStickData[i][3];
                if (max >= maxTemp) {
                  maxTemp = max;
                  indexTempMax = i;
                }
                if (min <= minTemp) {
                  minTemp = min;
                }
              }
              if (indexTempMax <= limit - 3 && indexTempMax >= 3) {
                maxBiggerPriceHistory = maxTemp;
                minPriceHistory = minTemp;
              } else if (limit < 20) {
                limit += 10;
              } else {
                break;
              }
            }
            if (
              maxBiggerPriceHistory &&
              candleCheck[4] * 1.011 <= maxBiggerPriceHistory &&
              candleCheck[4] <= 1.0022 * minPriceHistory &&
              candleCheck[4] >= 0.9978 * minPriceHistory
            ) {
              isAbleOrder = true;
            }

            break;

          case "down":
            let maxLowestPriceHistory = 0;
            let limitCheck = 10;

            while (!maxLowestPriceHistory) {
              let minTemp = candleStickData[0][3];
              for (let i = 0; i < limitCheck; i++) {
                const min = candleStickData[i][3];
                if (min <= minTemp) {
                  minTemp = min;
                }
              }
              if (candleCheck[4] * 0.985 >= minTemp) {
                maxLowestPriceHistory = minTemp;
              } else if (limit < 20) {
                limit += 10;
              } else {
                break;
              }
            }
            if (maxLowestPriceHistory) {
              isAbleOrder = true;
            }

            break;
          default:
            break;
        }
      } else {
        isAbleOrder = type === trend;

        // handle before action
        if (type === "up" && trend === "up") {
          const [currentCandle, prevCandle] = candleStickData;
          const [min0, min1, min2] = listMin;

          if (model === 1 && min0 < min1) {
            isAbleOrder = false;
          } else if (isNearByRestriction(candleStickData)) {
            isAbleOrder = false;
          } else if (
            checkPinbar(currentCandle, "up") &&
            checkFullCandle(prevCandle, "down")
          ) {
            isAbleOrder = false;
          }
        } else if (type === "up" && trend === "down") {
          const [currentCandle, prevCandle] = candleStickData;
          const [min0, min1, ...rest] = getMinMaxRangePeriod(
            candleStickData,
            3,
            15,
            "min"
          );

          if (
            checkPinbar(currentCandle, "up") &&
            checkInRange(currentCandle[4], min0, 0.6) &&
            // !checkFullCandle(prevCandle, "down")
            isDownCandle(prevCandle) &&
            prevCandle[1] / currentCandle[1] < 1.0085
          ) {
            isAbleOrder = true;
          } else if (
            checkFullCandle(currentCandle, "up") &&
            currentCandle[2] / currentCandle[3] >= 1.006 &&
            currentCandle[2] / currentCandle[3] <= 1.015 &&
            checkInRange(currentCandle[1], min0, 0.3)
          ) {
            isAbleOrder = true;
          }
        } else if (type === "down" && trend === "up") {
          // const [max0, max1, ...rest] = getMinMaxRangePeriod(
          //   candleStickData,
          //   3,
          //   15,
          //   "max"
          // );
          // const currentCandle = candleStickData[0];
          // if (max0 > max1 && checkInRange(currentCandle[4], max0, 0.3)) {
          //   isAbleOrder = true;
          // }
        } else if (type === "down" && trend === "down") {
          const currentCandle = candleStickData[0];
          const [min0, min1, ...rest] = getMinMaxRangePeriod(
            candleStickData,
            3,
            15,
            "min"
          );
          if (currentCandle[4] * 0.988 < min0) {
            isAbleOrder = false;
          } else if (checkInRange(min0, currentCandle[4], 0.3)) {
            isAbleOrder = false;
          } else if (checkPinbar(currentCandle, "down")) {
            const min = Math.min(
              ...candleStickData
                .map((candle, index) => {
                  if (index <= 10) {
                    return candle[4];
                  }
                })
                .filter(Boolean)
            );

            if (min < currentCandle[4] && currentCandle[4] / min < 1.02) {
              // có 1 lực tăng lớn, việc vào lệnh ngay lúc này sẽ rất rủi ro nên cần ngăn chặn việc thực hiện lệnh này
              isAbleOrder = false;
            }
          }
        }
      }
    }
  }

  return {
    isAbleOrder,
    type,
    symbol,
    model: modelPattern,
    trend: trendSymbol,
    modelTrend,
  };
};

const detectPattern = (candleStickData) => {
  let type = "";
  let isHasPattern = false;
  let skipCheckTrendLine = false;
  let model;

  const candlePrev = candleStickData[1];
  const candleLastest = candleStickData[0];
  if (
    isDownCandle(candlePrev) &&
    isUpCandle(candleLastest) &&
    Math.abs(candleLastest[2] - candleLastest[4]) /
      Math.abs(candleLastest[1] - candleLastest[4]) <=
      0.75 &&
    Math.abs(candleLastest[1] - candleLastest[4]) /
      Math.abs(candlePrev[1] - candlePrev[4]) >=
      1.15
  ) {
    type = "up";
    model = 1;
    isHasPattern = true;
  } else if (
    isDownCandle(candlePrev) &&
    checkFullCandle(candleLastest, "up") &&
    candleLastest[4] > candlePrev[1]
  ) {
    type = "up";
    model = 2;
    isHasPattern = true;
  } else if (checkPinbar(candleLastest, "up")) {
    type = "up";
    model = 3;
    isHasPattern = true;
  }

  //down
  else if (
    checkFullCandle(candlePrev, "down") &&
    isUpCandle(candleLastest) &&
    Math.abs(candleLastest[1] - candleLastest[4]) /
      Math.abs(candlePrev[1] - candlePrev[4]) >=
      0.4 &&
    Math.abs(candleLastest[2] - candleLastest[4]) /
      Math.abs(candleLastest[1] - candleLastest[4]) >=
      0.9
  ) {
    type = "down";
    model = 1;
    isHasPattern = true;
  } else if (checkPinbar(candleLastest, "down")) {
    type = "down";
    model = 2;
    isHasPattern = true;
  } else if (
    isUpCandle(candlePrev) &&
    isDownCandle(candleLastest) &&
    Math.abs(candleLastest[3] - candleLastest[4]) /
      Math.abs(candleLastest[1] - candleLastest[4]) <=
      0.5 &&
    Math.abs(candleLastest[1] - candleLastest[4]) /
      Math.abs(candlePrev[1] - candlePrev[4]) >=
      0.8
  ) {
    type = "down";
    model = 3;
    isHasPattern = true;
  }
  return { type, isHasPattern, skipCheckTrendLine, model };
};

const isNearByRestriction = (candleStickData, typeRange = "high") => {
  const currentCandle = candleStickData[0][4];
  let result = false;

  if (typeRange === "high") {
    const period = 20;
    const maxPeriod = [];
    candleStickData.forEach((candle, idx) => {
      let index = Math.floor(idx / period);
      if (index < 4) {
        if (!maxPeriod[index]) {
          maxPeriod[index] = [candle];
        } else {
          maxPeriod[index].push(candle);
        }
      }
    });

    const listMaxPrice = maxPeriod.map((period) =>
      Math.max(...period.map((candle) => parseFloat(candle[4])))
    );

    const [max0, max1, ...restMax] = listMaxPrice;

    if (currentCandle >= max0 || currentCandle * 1.008 >= max0) {
      result = true;
    }
  } else {
  }

  return result;
};
