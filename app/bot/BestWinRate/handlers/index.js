import { PATTERN_LONG } from "./functions/LONG/index.js";
import { PATTERN_SHORT } from "./functions/SHORT/index.js";

const ORDER_TYPE = {
  LONG: "LONG",
  SHORT: "SHORT",
};

const checkAbleOrder = (candleStickData, symbol, typeCheck, patternFn) => {
  const result = {
    type: "",
    symbol,
    isAbleOrder: false,
    tpPercent: 1,
    slPercent: 1,
    timeStamp: null,
  };

  const newData = { ...result };

  const {
    type,
    isAllowOrder,
    slPercent,
    timeStamp,
    entry,
    tpPercent,
    methodRR,
    keyFn
  } = patternFn(candleStickData, symbol, typeCheck);

  if (isAllowOrder) {
    newData.type = type;
    newData.symbol = symbol;
    newData.isAbleOrder = true;
    newData.slPercent = slPercent;
    newData.tpPercent = tpPercent || slPercent * RR;
    newData.timeStamp = timeStamp;
    newData.entry = entry;
    newData.methodRR = methodRR;
    newData.keyFn = keyFn;
  }
  return newData;
};

const buildCheckAbleOrder = (patternObj) => {
  const newPattern = Object.keys({ ...patternObj }).reduce((acc, key) => {
    acc[key] = (candleStickData, symbol, typeCheck) =>
      checkAbleOrder(candleStickData, symbol, typeCheck, patternObj[key]);

    return acc;
  }, {});

  return newPattern;
};

export const ExecuteFn = {
  [ORDER_TYPE.LONG]: buildCheckAbleOrder(PATTERN_LONG),
  [ORDER_TYPE.SHORT]: buildCheckAbleOrder(PATTERN_SHORT),
};
