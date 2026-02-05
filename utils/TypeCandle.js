import { TYPE_OF_PRICE } from "../constant.js";

const { OPEN, HIGH, LOW, CLOSE } = TYPE_OF_PRICE;

export const checkFullCandle = (candle, type, avgCandleBody) => {
  let isFullCandle = false;
  if (type === "up") {
    isFullCandle =
      Math.abs(candle[HIGH] - candle[CLOSE]) /
        Math.abs(candle[CLOSE] - candle[OPEN]) <=
        0.2 && (+candle[CLOSE] - +candle[OPEN]) / avgCandleBody >= 1.25;
  } else if (type === "down") {
    isFullCandle =
      Math.abs(candle[LOW] - candle[CLOSE]) /
        Math.abs(candle[CLOSE] - candle[OPEN]) <=
        0.2 && (+candle[OPEN] - +candle[CLOSE]) / avgCandleBody >= 1.25;
  }

  return isFullCandle;
};

export const checkPinbar = (candle, typeCheck) => {
  const isUp = candle[CLOSE] - candle[OPEN] >= 0;
  let isPinbarCandle = false;

  if (typeCheck === "up" && isUp) {
    isPinbarCandle =
      Math.abs(candle[LOW] - candle[OPEN]) /
        Math.abs(candle[CLOSE] - candle[OPEN]) >=
        0.8 &&
      Math.abs(candle[LOW] - candle[OPEN]) /
        Math.abs(candle[HIGH] - candle[CLOSE]) >=
        2 &&
      candle[HIGH] / candle[LOW] >= 1.01;
  } else if (typeCheck === "up") {
    isPinbarCandle =
      Math.abs(candle[LOW] - candle[CLOSE]) /
        Math.abs(candle[OPEN] - candle[CLOSE]) >=
        3 &&
      Math.abs(candle[LOW] - candle[CLOSE]) /
        Math.abs(candle[HIGH] - candle[OPEN]) >=
        5 &&
      candle[HIGH] / candle[LOW] >= 1.01;
  } else if (typeCheck === "down" && isUp) {
    isPinbarCandle =
      Math.abs(candle[HIGH] - candle[CLOSE]) /
        Math.abs(candle[CLOSE] - candle[OPEN]) >=
        3 &&
      Math.abs(candle[HIGH] - candle[CLOSE]) /
        Math.abs(candle[LOW] - candle[OPEN]) >=
        2 &&
      candle[HIGH] / candle[LOW] >= 1.0065;
  } else if (typeCheck === "down") {
    isPinbarCandle =
      Math.abs(candle[HIGH] - candle[OPEN]) /
        Math.abs(candle[OPEN] - candle[CLOSE]) >=
        0.8 &&
      Math.abs(candle[HIGH] - candle[OPEN]) /
        Math.abs(candle[LOW] - candle[CLOSE]) >=
        1.5 &&
      candle[HIGH] / candle[LOW] >= 1.0065;
  }

  return isPinbarCandle;
};

export const checkDoji = (candle) => {
  const isUp = candle[4] - candle[1] >= 0;
  let isDoji = false;

  if (isUp) {
    const rate =
      Math.abs(candle[2] - candle[4]) / Math.abs(candle[3] - candle[1]);
    isDoji =
      (candle[4] / candle[1] < 1.0009 || candle[1] / candle[4] > 0.9991) &&
      rate >= 0.9 &&
      rate <= 1.1;
  } else {
    const rate =
      Math.abs(candle[2] - candle[1]) / Math.abs(candle[3] - candle[4]);
    isDoji =
      (candle[1] / candle[4] < 1.0009 || candle[4] / candle[1] > 0.9991) &&
      rate >= 0.9 &&
      rate <= 1.1;
  }

  return isDoji;
};

export const isUpCandle = (candle) => {
  return parseFloat(candle[1]) - parseFloat(candle[4]) <= 0;
};

export const isDownCandle = (candle) => {
  return parseFloat(candle[1]) - parseFloat(candle[4]) > 0;
};

export const checkInRange = (candle1, candle2, range = 0) => {
  let candleMark = candle1 <= candle2 ? candle1 : candle2;
  let candleCheck = candle1 > candle2 ? candle1 : candle2;

  const rateUp = (100 + range) / 100;
  const rateDown = (100 - range) / 100;

  const isInRange =
    candleCheck <= candleMark * rateUp && candleCheck >= candleMark * rateDown;

  return isInRange;
};

export const isHitFVG = (candleStickData, type = "up", distance = 15) => {
  let result = false;
  const lastestCandle = candleStickData.slice(-1)[0];

  if (type === "up") {
    for (let i = candleStickData.length - 2; i >= 2; i--) {
      const lowestLastCandle = +candleStickData[i][3];
      const highestThirdLastCandle = +candleStickData[i - 2][2];
      const isTripleUpcandle =
        isUpCandle(candleStickData[i]) &&
        isUpCandle(candleStickData[i - 1]) &&
        isUpCandle(candleStickData[i - 2]);
      const fvgValue = lowestLastCandle - highestThirdLastCandle;
      const distanceFromFVG = candleStickData.length - 1 - i;

      result =
        fvgValue > 0 &&
        +lastestCandle[3] < lowestLastCandle &&
        +lastestCandle[3] > highestThirdLastCandle &&
        distanceFromFVG >= distance &&
        isTripleUpcandle;

      if (result) {
        break;
      }
    }
  } else if (type === "down") {
    for (let i = candleStickData.length - 1; i >= 2; i--) {
      const highestLastCandle = +candleStickData[i][2];
      const lowestThirdLastCandle = +candleStickData[i - 2][3];
      const isTripleDowncandle =
        isDownCandle(candleStickData[i]) &&
        isDownCandle(candleStickData[i - 1]) &&
        isDownCandle(candleStickData[i - 2]);

      const fvgValue = lowestThirdLastCandle - highestLastCandle;
      const distanceFromFVG = listCandleInRange.length - 1 - i;

      value =
        fvgValue > 0 &&
        +lastestCandle[2] < lowestThirdLastCandle &&
        +lastestCandle[2] > highestLastCandle &&
        distanceFromFVG >= distance &&
        isTripleDowncandle;

      if (value) {
        break;
      }
    }
  }

  return result;
};
