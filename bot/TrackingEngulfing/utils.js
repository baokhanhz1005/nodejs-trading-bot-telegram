export const checkEngulfing = (candle1, candle2) => {
  let result = {
    isEngulfing: false,
    type: "up",
  };
  const isAllowCheck =
    Math.abs(candle1[1] - candle1[4]) - Math.abs(candle2[1] - candle2[4]) > 0;

  if (isAllowCheck) {
    const isLastestInCreaseCandle = candle1[4] - candle1[1] > 0;

    if (isLastestInCreaseCandle) {
      const isPreviousDecreaseCandle = candle2[1] - candle2[4] > 0;
      if (isPreviousDecreaseCandle) {
        result.isEngulfing = candle1[4] > candle2[4];
        result.type = "up";
      } else {
        result.isEngulfing = false;
        result.type = "up";
      }
    } else {
      const isPreviousIncreaseCandle = candle2[1] - candle2[4] < 0;
      if (isPreviousIncreaseCandle) {
        result.isEngulfing = candle1[4] < candle2[4];
        result.type = "down";
      } else {
        result.isEngulfing = false;
        result.type = "down";
      }
    }
  }

  return result;
};

export const isMarubozu = (candleData, type) => {
  if (type === "up") {
    return candleData[4] > 0.998 * candleData[2];
  } else {
    return candleData[4] < 1.002 * candleData[3];
  }
};
