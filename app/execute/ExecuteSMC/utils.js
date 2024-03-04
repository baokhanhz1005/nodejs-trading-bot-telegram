import {
  checkFullCandle,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import {
  checkCurrentTrending,
  getMaxOnListCandle,
  getMinOnListCandle,
  rateUpAndDown,
} from "../../../utils/handleDataCandle.js";
import { REWARD, RR, LIMIT_ORDER } from "./constant.js";

export const checkAbleOrderSMC = (candleStickData, symbol) => {
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
  const count = candleStickData.length;
  const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
    candleStickData.slice(-4);
  const max = Math.max(
    ...candleStickData.slice(-50).map((candle) => parseFloat(candle[2]))
  );
  const min = Math.min(
    ...candleStickData.slice(-50).map((candle) => parseFloat(candle[3]))
  );

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

  if (true && checkFullCandle(lastestCandle, "up")) {
    const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    const indexMin = candleStickData
      .slice(-50)
      .findIndex((candle) => +candle[3] === +minRange50);
    if (minRange50 * 1.015 > lastestCandle[3]) {
      const EstRR = (lastestCandle[4] / minRange50 - 1) * 100 * 1.05;

      // --------CONDITION----------//
      const CONDITION_1__ =
        lastestCandle[4] * (1 + (EstRR * RR) / 100) < maxRange50;
      // --------CONDITION----------//
      const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;

      if (CONDITION_1__ && CONDITION_2__ && lastestCandle[4] < LIMIT_ORDER) {
        slPercent = EstRR;
        type = "up";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    }
  } else if (
    true &&
    isDownCandle(lastestCandle) &&
    lastestCandle[2] / lastestCandle[3] >= 1.004
  ) {
    const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    const avrgField = (maxRange50 + minRange50) * 0.5;
    const indexMax = candleStickData
      .slice(-50)
      .findIndex((candle) => +candle[2] === +maxRange50);
    if (maxRange50 * 0.998 < lastestCandle[2]) {
      // const EstRR = (1 - lastestCandle[4] / maxRange50) * 100 * 1.05;
      const EstRR = (maxRange50 / lastestCandle[4] - 1) * 100 * 1.1;
      const CONDITION_1__ =
        lastestCandle[4] * (1 - (EstRR * RR) / 100) > avrgField;
      const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;
      const listFullCandle = [];
      candleStickData.slice(-10).forEach((candle) => {
        if (checkFullCandle(candle, "up")) {
          listFullCandle.push(candle);
        }
      });
      const CONDITION_3__ = listFullCandle.length < 4;
      const CONDITION_4__ = candleStickData
        .slice(-25)
        .every((candle) =>
          isUpCandle(candle) ? candle[4] / candle[1] < 1.03 : true
        );
      if (
        CONDITION_1__ &&
        CONDITION_2__ &&
        CONDITION_4__ &&
        lastestCandle[4] < LIMIT_ORDER
      ) {
        slPercent = EstRR;
        type = "down";
        isAllowOrder = true;
        timeStamp = lastestCandle[0];
      }
    }
  }

  return { type, slPercent, isAllowOrder, timeStamp };
};

// if (isDownCandle(prevCandle) && prevCandle[1] < lastestCandle[4]) {
//   const listLastCandle = candleStickData.slice(-25);
//   const minBounce = Math.min(
//     ...listLastCandle.map((candle) => parseFloat(candle[4]))
//   );
//   const maxBounce = Math.max(
//     ...listLastCandle.map((candle) => parseFloat(candle[4]))
//   );
//   const indexMin = listLastCandle.findIndex(
//     (candle) => parseFloat(candle[4]) === minBounce
//   );

//   const CONDITION_1__ = indexMin <= 15;
//   const CONDITION_2__ = lastestCandle[4] < maxBounce;

//   if (CONDITION_1__ && CONDITION_2__) {
//     if (
//       lastestCandle[3] < minBounce * 1 ||
//       prevCandle[3] < minBounce * 1 ||
//       thirdLastCandle[3] < minBounce * 1
//     ) {
//       slPercent =
//         (lastestCandle[3] > prevCandle[3]
//           ? (lastestCandle[4] / prevCandle[3] - 1) * 100
//           : (lastestCandle[4] / lastestCandle[3] - 1) * 100) * 1.15;
//       const targetPrice = lastestCandle[4] * (1 + (slPercent * RR) / 100);
//       if (targetPrice <= max) {
//         type = "up";
//         isAllowOrder = true;
//         timeStamp = lastestCandle[0];
//       }
//     }
//   }
// }

// if (isDownCandle(lastestCandle) && !checkPinbar(lastestCandle, "up")) {
//   const maxListCandle = Math.max(
//     ...candleStickData.slice(-50).map((candle) => candle[2])
//   );
//   const CONDITION_1__ = [+lastestCandle[2]].includes(+maxListCandle);
//   const CONDITION_2__ =
//     lastestCandle[4] * 1.0005 < prevCandle[1] ||
//     lastestCandle[4] * 1.0005 < thirdLastCandle[1];
//   const CONDITION_3__ = !checkFullCandle(thirdLastCandle, "up");
//   const CONDITION_4__ =
//     (+lastestCandle[1] / +lastestCandle[4] - 1) * 100 > 0.25;
//   if (CONDITION_1__ && CONDITION_2__ && CONDITION_3__ && CONDITION_4__) {
//     slPercent =
//       (lastestCandle[2] < prevCandle[2]
//         ? (prevCandle[2] / lastestCandle[4] - 1) * 100
//         : (lastestCandle[2] / lastestCandle[4] - 1) * 100) * 1.15;
//     const targetPrice = lastestCandle[4] * (1 - (slPercent * RR) / 100);
//     if (targetPrice >= min) {
//       type = "down";
//       isAllowOrder = true;
//     }
//   }
// }
