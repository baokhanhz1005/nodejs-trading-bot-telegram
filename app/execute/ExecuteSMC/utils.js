import {
  checkFullCandle,
  checkPinbar,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
import {
  checkCurrentTrending,
  findContinueSameTypeCandle,
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

  if (true && (checkFullCandle(lastestCandle, "up"))) {
    const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
    const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
    const avrgField = (maxRange50 + minRange50) * 0.5;

    if (minRange50 * 1.015 > lastestCandle[3]) {
      const EstRR = (lastestCandle[4] / minRange50 - 1) * 100 * 1.05;

      // --------CONDITION----------//
      const CONDITION_1__ =
        lastestCandle[4] * (1 + (EstRR * RR) / 100) < maxRange50;

      const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;

      const CONDITION_3__ = isDownCandle(prevCandle, "down")
        ? (prevCandle[1] - prevCandle[4]) /
            (lastestCandle[4] - lastestCandle[1]) <
          1.7
        : true;
      const CONDITION_4__ =
        lastestCandle[4] * (1 + (EstRR * RR) / 100) < avrgField;

      const CONDITION_5__ = candleStickData
        .slice(-15)
        .every((candle) =>
          isDownCandle(candle) ? candle[1] / candle[4] < 1.02 : true
        );

      const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
        candleStickData.slice(-25)
      );

      const CONDITION_6__ = maxContinueDown < 5;

      // --------CONDITION----------//

      if (
        CONDITION_1__ &&
        CONDITION_2__ &&
        CONDITION_3__ &&
        // CONDITION_4__ &&
        CONDITION_5__ &&
        CONDITION_6__ &&
        lastestCandle[4] < LIMIT_ORDER
      ) {
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
