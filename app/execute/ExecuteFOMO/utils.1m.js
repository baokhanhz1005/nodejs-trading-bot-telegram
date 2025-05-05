import {
  checkTrendingLine,
  exchangePrice,
  findContinueSameTypeCandle,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
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
import { MODEL_CANDLE_TYPE } from "./constant.js";

const { COST, RR, RATE_SL, limitPeakOrBottom } = CONFIG_QUICK_TRADE;

export const checkAbleQuickOrder1M = (candleStickData, symbol, typeCheck) => {
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
  let timeStamp = "";
  let tpPercent = null;

  if (
    candleStickData &&
    candleStickData.length &&
    candleStickData.slice(-50).some((candle) => candle[2] / candle[3] > 1.05)
  ) {
    return { type, slPercent, isAllowOrder };
  }

  const threeLatestCandle = candleStickData.slice(-3);

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
  const rangeCandle15 = candleStickData.slice(-15);
  const rangeCandle30 = candleStickData.slice(-30);
  const rangeCandle50 = candleStickData.slice(-50);
  const rangeCandle75 = candleStickData.slice(-75);
  const rangeCandle100 = candleStickData.slice(-100);

  const minRange15 = getMinOnListCandle(rangeCandle15, 4);
  const maxRange15 = getMaxOnListCandle(rangeCandle15, 4);
  const maxRange30 = getMaxOnListCandle(rangeCandle30, 4);
  const minRange30 = getMinOnListCandle(rangeCandle30, 4);

  const maxRange50 = getMaxOnListCandle(rangeCandle50, 2);
  const minRange50 = getMinOnListCandle(rangeCandle50, 3);

  const minRange75 = getMinOnListCandle(rangeCandle75, 4);
  const maxRange75 = getMaxOnListCandle(rangeCandle75, 4);

  const minRange75Info = getMinOnListCandle(rangeCandle75, 4, 1);
  const maxRange75Info = getMaxOnListCandle(rangeCandle75, 4, 1);

  const maxRange150 = getMaxOnListCandle(candleStickData, 4);
  const minRange150 = getMinOnListCandle(candleStickData, 4);

  const max2Range15 = getMaxOnListCandle(rangeCandle15, 2);
  const min3Range15 = getMinOnListCandle(rangeCandle15, 3);

  const max2Range30 = getMaxOnListCandle(rangeCandle30, 2);
  const min3Range30 = getMinOnListCandle(rangeCandle30, 3);

  const minimumFractionalPart = getSmallestFractionPart(lastestCandle[4]);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    rangeCandle50,
    minimumFractionalPart
  );

  // init data
  let CONDITION = {};
  let currentRR = 1;
  let EstRR = 1;

  if (
    true &&
    (!typeCheck || typeCheck === 1) &&
    checkTrendingLine(rangeCandle75) === "up"
  ) {
    switch (true) {
      // main trending

      case true: {
        // mini condition
        switch (true) {
          case true && isUpCandle(lastestCandle, "up"): {
            EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.5;
            currentRR = 1;

            // condition
            CONDITION = {
              COND_1: () => EstRR > 0.3 && EstRR < 0.9,
              // COND_2: () => (maxRange30 / minRange30 - 1) / (EstRR / 100) >= 2,
              // COND_3: () => +lastestCandle[3] === +min3Range15,
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
  } else if (false && (!typeCheck || typeCheck === 2) && trendLine === "down") {
    switch (true) {
      case checkTrendingLine(rangeCandle100, 60) === "down": {
        // mini condition
        switch (true) {
          case true && checkFullCandle(lastestCandle, "down"): {
            EstRR = (max2Range30 / lastestCandle[4] - 1) * 100 * 1.3;
            currentRR = 0.5;

            // condition
            CONDITION = {
              COND_1: () => EstRR > 1 && EstRR < 1.5,
              COND_2: () => max2Range15 < max2Range30,
              COND_3: () => isUpCandle(prevCandle),
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

// if (true && checkFullCandle(lastestCandle, "up")) {
//   const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * RATE_SL;

//   // condition
//   const COND_1 = EstRR > 0.2 && EstRR < 0.6;

//   const isPassCondition = [COND_1].every((cond) => !!cond);

//   if (true && isPassCondition) {
//     slPercent = EstRR;
//     type = "up";
//     isAllowOrder = true;

//     timeStamp = lastestCandle[0];
//   }
// } else if (true && checkFullCandle(lastestCandle, "down")) {
//   const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * RATE_SL;

//   // condition
//   const COND_1 = EstRR > 0.2 && EstRR < 0.6;

//   const isPassCondition = [COND_1].every((cond) => !!cond);

//   if (true && isPassCondition) {
//     slPercent = EstRR;
//     type = "down";
//     isAllowOrder = true;
//     timeStamp = lastestCandle[0];
//   }
// }

// break;
// }
