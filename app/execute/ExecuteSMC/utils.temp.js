import {
    checkFullCandle,
    checkPinbar,
    isDownCandle,
    isUpCandle,
  } from "../../../utils/TypeCandle.js";
  import {
    checkCurrentTrending,
    findContinueSameTypeCandle,
    forecastTrending,
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
  
    if (
      true &&
      (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up"))
    ) {
      const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
      const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
      const avrgField = (maxRange50 + minRange50) * 0.5;
  
      const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
        candleStickData.slice(-25)
      );
  
      if (true && minRange50 * 1.005 > lastestCandle[3]) {
        const EstRR = (lastestCandle[4] / minRange50 - 1) * 100 * 1.2;
  
        // --------CONDITION----------//
        const CONDITION_1__ =
          lastestCandle[4] * (1 + (EstRR * RR) / 100) < maxRange50;
  
        const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;
  
        const CONDITION_3__ = isDownCandle(prevCandle, "down")
          ? (prevCandle[1] - prevCandle[4]) /
              (lastestCandle[4] - lastestCandle[1]) <
            0.9
          : true;
        const CONDITION_4__ =
          lastestCandle[4] * (1 + (EstRR * RR) / 100) < avrgField;
  
        const CONDITION_5__ = candleStickData
          .slice(-15)
          .every((candle) =>
            isDownCandle(candle) ? candle[1] / candle[4] < 1.014 : true
          );
  
        const CONDITION_6__ = maxContinueDown < 4;
  
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
      } else if (false && maxRange50 * 0.999 < lastestCandle[2]) {
        const rangeCandle30 = candleStickData.slice(-17);
        const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.25;
        const CONDITION_1__ = maxContinueUp > 5;
        const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;
        const CONDITION_3__ = rangeCandle30[0][4] < lastestCandle[4] * 0.968;
        const CONDITION_6__ =
          lastestCandle[4] / candleStickData.slice(-50)[0][4] > 1.021;
        if (
          CONDITION_1__ &&
          CONDITION_2__ &&
          CONDITION_3__ &&
          CONDITION_6__ &&
          // CONDITION_4__ &&
          // CONDITION_5__ &&
  
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
      lastestCandle[2] / lastestCandle[3] >= 1.004 &&
      (checkPinbar(lastestCandle, "down") ||
        checkFullCandle(lastestCandle, "down"))
    ) {
      const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
      const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
      const avrgField = (maxRange50 + minRange50) * 0.5;
      const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
        candleStickData.slice(-25)
      );
      if (false && maxRange50 * 0.999 < lastestCandle[2]) {
        // const EstRR = (1 - lastestCandle[4] / maxRange50) * 100 * 1.05;
        const EstRR = (maxRange50 / lastestCandle[4] - 1) * 100 * 1.5;
        const CONDITION_1__ =
          lastestCandle[4] * (1 - (EstRR * RR) / 100) > minRange50 * 1.01;
  
        const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;
  
        const CONDITION_4__ = candleStickData
          .slice(-30)
          .every((candle) =>
            isUpCandle(candle) ? candle[4] / candle[1] < 1.016 : true
          );
  
        const CONDITION_5__ =
          (isUpCandle(prevCandle) &&
            (prevCandle[4] - prevCandle[1]) /
              (lastestCandle[1] - lastestCandle[4]) <
              0.69) ||
          (isUpCandle(thirdLastCandle) &&
            isDownCandle(prevCandle) &&
            lastestCandle[4] < thirdLastCandle[1]);
        if (
          CONDITION_1__ &&
          CONDITION_2__ &&
          CONDITION_4__ &&
          CONDITION_5__ &&
          lastestCandle[4] < LIMIT_ORDER
        ) {
          slPercent = EstRR;
          type = "down";
          isAllowOrder = true;
          timeStamp = lastestCandle[0];
        }
      } else if (true && minRange50 * 1.0015 > lastestCandle[3]) {
        const rangeCandle30 = candleStickData.slice(-16);
        const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.35;
        const CONDITION_1__ = maxContinueDown > 3;
        const CONDITION_2__ = (REWARD / EstRR) * 100 <= LIMIT_ORDER;
        const CONDITION_3__ = rangeCandle30[0][4] * 0.95 > lastestCandle[4];
        // const CONDITION_4__ = lastestCandle[1] / lastestCandle[4] < 1.006;
        // const CONDITION_5__ = candleStickData.slice(-5)[0][3] * 0.991 > lastestCandle[4]
        if (
          CONDITION_1__ &&
          CONDITION_2__ &&
          CONDITION_3__ &&
          // CONDITION_4__ &&
          // CONDITION_5__ &&
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
  