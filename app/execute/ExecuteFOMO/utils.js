import { EMA } from "technicalindicators";
import {
  checkTrendingLine,
  countContinueDow,
  countContinueUp,
  exchangePrice,
  findContinueSameTypeCandle,
  getEMA,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
  getPreListCandle,
  getSmallestFractionPart,
  isDownTrending,
  isUpTrending,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import { CONFIG_QUICK_TRADE } from "./config.js";

const { COST, RR, RATE_SL, limitPeakOrBottom } = CONFIG_QUICK_TRADE;

export const checkAbleQuickOrder = (candleStickData, symbol, typeCheck) => {
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
  } = checkPattern(candleStickData, symbol, typeCheck);

  if (isAllowOrder) {
    newData.type = type;
    newData.symbol = symbol;
    newData.isAbleOrder = true;
    newData.slPercent = slPercent;
    newData.tpPercent = tpPercent || slPercent * RR;
    newData.timeStamp = timeStamp;
    newData.entry = entry;
    newData.methodRR = methodRR;
  }
  return newData;
};

const checkPattern = (candleStickData, symbol, typeCheck) => {
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
  let methodRR = "";
  let tpPercent = null;
  let timeStamp = "";

  if (
    candleStickData &&
    candleStickData.length &&
    candleStickData.slice(-50).some((candle) => candle[2] / candle[3] > 1.05)
  ) {
    return { type, slPercent, isAllowOrder };
  }

  const threeLatestCandle = candleStickData.slice(-3);

  // EMA
  const EMA20 = getEMA(20, candleStickData.slice(-20));
  const EMA50 = getEMA(50, candleStickData.slice(-50));
  const EMA100 = getEMA(100, candleStickData.slice(-100));
  const EMA200 = getEMA(200, candleStickData.slice(-200));

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
  // && lastestCandle[4] * 0.985 < lastestPeakPrice;
  const limit = 11;
  const rangeCandle10 = candleStickData.slice(-10);
  const rangeCandle15 = candleStickData.slice(-15);
  const rangeCandle30 = candleStickData.slice(-30);
  const rangeCandle20 = candleStickData.slice(-20);
  const rangeCandle50 = candleStickData.slice(-50);
  const rangeCandle75 = candleStickData.slice(-75);
  const rangeCandle100 = candleStickData.slice(-100);

  const maxRange10 = getMaxOnListCandle(rangeCandle10, 4);
  const minRange10 = getMinOnListCandle(rangeCandle10, 4);

  const maxRange15 = getMaxOnListCandle(rangeCandle15, 4);
  const minRange15 = getMinOnListCandle(rangeCandle15, 4);

  const maxRange30 = getMaxOnListCandle(rangeCandle30, 4);
  const minRange30 = getMinOnListCandle(rangeCandle30, 4);
  const min3Range30 = getMinOnListCandle(rangeCandle30, 3);

  const maxRange50 = getMaxOnListCandle(rangeCandle50, 4);
  const minRange50 = getMinOnListCandle(rangeCandle50, 4);

  const minRange75 = getMinOnListCandle(rangeCandle75, 4);
  const maxRange75 = getMaxOnListCandle(rangeCandle75, 4);

  const minRange75Info = getMinOnListCandle(rangeCandle75, 4, 1);
  const maxRange75Info = getMaxOnListCandle(rangeCandle75, 4, 1);

  const maxRange100 = getMaxOnListCandle(rangeCandle100, 4);
  const minRange100 = getMinOnListCandle(rangeCandle100, 4);

  const maxRange150 = getMaxOnListCandle(candleStickData, 4);
  const minRange150 = getMinOnListCandle(candleStickData, 4);

  const minimumFractionalPart = getSmallestFractionPart(lastestCandle[4]);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    rangeCandle15,
    minimumFractionalPart
  );

  const min3Range10 = getMinOnListCandle(rangeCandle10, 3);
  const max2Range10 = getMaxOnListCandle(rangeCandle10, 2);

  const min3Range15 = getMinOnListCandle(rangeCandle15, 3);
  const max2Range15 = getMaxOnListCandle(rangeCandle15, 2);

  const max2Range30 = getMaxOnListCandle(rangeCandle30, 2);
  const min3Range50 = getMinOnListCandle(rangeCandle50, 3);

  const trendLine = checkTrendingLine(candleStickData);

  // init data
  let CONDITION = {};
  let currentRR = 1;
  let EstRR = 1;

  const isUpEMA = EMA100 > EMA200;
  const isDownEMA = EMA200 > EMA100;

  if (true && isUpEMA) {
    switch (true) {
      // main trending
      case EMA20 < EMA50: {
        // mini condition
        switch (true) {
          case true && lastestCandle[2] < EMA20: {
            EstRR = (EMA20 / lastestCandle[4] - 1) * 100 * 1.25;
            currentRR = 1;

            // condition
            CONDITION = {
              COND_1: () => EstRR > 0.35 && EstRR < 0.6,
              COND_2: () =>
                checkFullCandle(forthLastCandle, "down") &&
                lastestCandle[4] < forthLastCandle[4] &&
                isDownCandle(lastestCandle),
            };

            const isPassCondition =
              Object.values(CONDITION).length &&
              Object.values(CONDITION).every((cond) => cond());

            if (true && isPassCondition) {
              slPercent = EstRR;
              tpPercent = EstRR * currentRR;
              type = "down";
              isAllowOrder = true;
              methodRR = currentRR;
              timeStamp = lastestCandle[0];
            }
            break;
          }

          default:
            break;
        }

        break;
      }

      default:
        break;
    }
  } else if (true && isDownEMA) {
    switch (true) {
      case EMA20 > EMA50: {
        // mini condition
        switch (true) {
          case true && lastestCandle[3] > EMA20: {
            EstRR = (lastestCandle[4] / EMA20 - 1) * 100 * 1.25;
            currentRR = 1;

            // condition
            CONDITION = {
              COND_1: () => EstRR > 0.35 && EstRR < 0.6,
              COND_2: () =>
                checkFullCandle(forthLastCandle, "up") &&
                lastestCandle[4] > forthLastCandle[4] &&
                isUpCandle(lastestCandle),
              // COND_3: () =>
              //   rangeCandle10.slice(-3).every((candle) => +candle[5] < +lastestCandle[5]),
            };

            const isPassCondition =
              Object.values(CONDITION).length &&
              Object.values(CONDITION).every((cond) => cond());

            if (true && isPassCondition) {
              slPercent = EstRR;
              tpPercent = EstRR * currentRR;
              type = "up";
              isAllowOrder = true;
              methodRR = currentRR;
              timeStamp = lastestCandle[0];
            }
            break;
          }

          default:
            break;
        }

        break;
      }

      default:
        break;
    }
  }

  return {
    type,
    slPercent,
    isAllowOrder,
    timeStamp,
    entry: lastestCandle[4],
    tpPercent,
    methodRR,
  };
};
