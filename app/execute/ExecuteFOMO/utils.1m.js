import {
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

export const checkAbleQuickOrder1M = (candleStickData, symbol) => {
  const result = {
    type: "",
    symbol,
    isAbleOrder: false,
    tpPercent: 1,
    slPercent: 1,
    timeStamp: null,
  };

  const newData = { ...result };

  const { type, isAllowOrder, slPercent, timeStamp, entry } = checkPattern(
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
    newData.entry = entry;
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

  const minimumFractionalPart = getSmallestFractionPart(lastestCandle[4]);

  const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
    rangeCandle50,
    minimumFractionalPart
  );

  let typeCandle = "";

  switch (true) {
    case isDownCandle(prevCandle) && checkFullCandle(lastestCandle, "up"): {
      typeCandle = MODEL_CANDLE_TYPE.ENGULFING;
      type = "up";
      break;
    }

    case isUpCandle(prevCandle) && checkFullCandle(lastestCandle, "down"): {
      typeCandle = MODEL_CANDLE_TYPE.ENGULFING;
      type = "down";
      break;
    }

    case checkFullCandle(
      lastestCandle,
      isUpCandle(lastestCandle) ? "up" : "down"
    ): {
      typeCandle = MODEL_CANDLE_TYPE.MARUBOZU;
      type = isUpCandle(lastestCandle) ? "up" : "down";
      break;
    }

    case exchangePrice(prevCandle) <= minimumFractionalPart * 3 &&
      prevCandle[2] / prevCandle[3] <= 1.001 &&
      (isUpCandle(lastestCandle)
        ? lastestCandle[4] > prevCandle[2]
        : lastestCandle[4] < prevCandle[3]): {
      typeCandle = MODEL_CANDLE_TYPE.DOJI;
      type = isUpCandle(lastestCandle) ? "up" : "down";
      break;
    }

    case isUpCandle(lastestCandle)
      ? checkPinbar(lastestCandle, "up")
      : checkPinbar(lastestCandle, "down"): {
      typeCandle = MODEL_CANDLE_TYPE.PIN_BAR;
      type = isUpCandle(lastestCandle) ? "up" : "down";
      break;
    }

    default:
      break;
  }

  switch (typeCandle) {
    case MODEL_CANDLE_TYPE.ENGULFING: {
      if (true && checkFullCandle(lastestCandle, "up")) {
        const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * RATE_SL;

        // condition
        const COND_1 = EstRR > 0.5 && EstRR < 1;
        const COND_2 = maxContinueDown <= 4;
        const COND_3 =
          findContinueSameTypeCandle(rangeCandle15, minimumFractionalPart)
            .maxContinueUp <= 4;

        const COND_4 =
          (maxRange150 / lastestCandle[4] - 1) /
            (lastestCandle[4] / lastestCandle[1] - 1) <=
          5;

        const isPassCondition = [COND_1, COND_2, COND_3, COND_4].every(
          (cond) => !!cond
        );

        if (true && isPassCondition) {
          slPercent = EstRR;
          type = "up";
          isAllowOrder = true;

          timeStamp = lastestCandle[0];
        }
      } else if (true && checkFullCandle(lastestCandle, "down")) {
        const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * RATE_SL;

        // condition
        const COND_1 = EstRR > 0.5 && EstRR < 1;
        const COND_2 = maxContinueUp <= 4;
        const COND_3 =
          findContinueSameTypeCandle(rangeCandle15, minimumFractionalPart)
            .maxContinueDown <= 4;

        const isPassCondition = [COND_1, COND_2, COND_3].every(
          (cond) => !!cond
        );

        if (true && isPassCondition) {
          slPercent = EstRR;
          type = "down";
          isAllowOrder = true;
          timeStamp = lastestCandle[0];
        }
      }

      break;
    }

    default:
      break;
  }

  return { type, slPercent, isAllowOrder, timeStamp, entry: lastestCandle[4] };
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
