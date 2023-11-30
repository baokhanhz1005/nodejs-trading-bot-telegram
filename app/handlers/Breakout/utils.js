export const findMinMaxPriceCandle = (dataCandle) => {
  let highest = 0;
  let lowest = 0;
  for (const candle of dataCandle) {
    if (!highest && !lowest) {
      highest = candle[4];
      lowest = candle[4];
    }
    if (candle[4] > highest) {
      highest = candle[4];
    } else if (candle[4] < lowest) {
      lowest = candle[4];
    }
  }

  return { highest, lowest };
};

export const isBreakOut = (dataCandle, priceCheck, limit, type = "up") => {
  let result = false;
  const lengthDataCandle = dataCandle.length - 1;
  for (let i = 0; i < limit; i++) {
      const candle = dataCandle[lengthDataCandle - i];
    if (type === "up") {
      if (candle[4] >= priceCheck) {
        result = true;
        break;
      }
    } else {
      if (candle[4] <= priceCheck) {
        result = true;
        break;
      }
    }
  }
  return result;
};
