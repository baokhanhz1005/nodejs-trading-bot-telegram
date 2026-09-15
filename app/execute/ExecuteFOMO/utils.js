import {
  calculateADX,
  classifyTrend,
  findContinueSameTypeCandle,
  getEMA,
  getListHighest,
  getListLowest,
  getMaxOnListCandle,
  getMinOnListCandle,
  isUpTrending,
  TREND,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isHitFVG,
  isUpCandle,
} from "../../../utils/TypeCandle.js";

export const checkAbleQuickOrder = (candleStickData, symbol, typeCheck) => {
  //   const count = candleStickData.length;
  const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
    candleStickData.slice(-4);

  let type = "";
  let isAllowOrder = false;
  let slPercent = 1;
  let methodRR = "";
  let tpPercent = null;
  let timeStamp = "";

  // init data
  let CONDITIONS = {};
  let EstRR = 1;

  const min3Range15 = getMinOnListCandle(candleStickData.slice(-15), 3);
  const max2Range15 = getMaxOnListCandle(candleStickData.slice(-15), 2);

  const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);
  const max2Range30 = getMaxOnListCandle(candleStickData.slice(-30), 2);

  const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
  const min4Range50 = getMinOnListCandle(candleStickData.slice(-50), 4);

  const avgCandleBody =
    candleStickData.slice(-50).reduce((acc, candle) => {
      return (acc += Math.abs(+candle[1] - +candle[4]));
    }, 0) / 50;

  const avgVolume = candleStickData.slice(-50).reduce((acc, candle) => {
    return (acc += +candle[5]);
  }, 0) / 50;
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
    candleStickData.slice(-30),
  );

  const getTrend = (candleStickData, lookback = 100) => {
    const listHighest = getListHighest(candleStickData.slice(-lookback), 15);

    const highs = listHighest.map((p) => p.price).slice(-3);

    const RATIO = 1.00;

    if (highs[1] / highs[0] > RATIO && highs[2] / highs[1] > RATIO) {
      return TREND.UP;
    } else if (highs[0] / highs[1] > RATIO && highs[1] / highs[2] > RATIO) {
      return TREND.DOWN;
    } else {
      return TREND.RANGE;
    }
  };

  const trend100 = getTrend(candleStickData, 100);

  const RANGE_EXCHANGE_LEVEL = (max4Range50 - min4Range50) / avgCandleBody;
  let currentRR = 3;
  const isReverse = false;

  if (RANGE_EXCHANGE_LEVEL <= 10) {
    CONDITIONS = {};
  } else if (trend100 === TREND.UP && true) {
    EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 0.8;
    type = "up";
    // condition
    CONDITIONS = {
      C1: () => EstRR > 0.5 && EstRR < 1.25,
      C2: () => isUpCandle(lastestCandle),
      C3: () => candleStickData.slice(-10).every(candle => +candle[5] < avgVolume),
    };
  } else if (trend100 === TREND.DOWN && true) {
    EstRR = (max2Range15 / lastestCandle[4] - 1) * 100 * 0.8;
    type = "down";
    // condition
    CONDITIONS = {
      C1: () => EstRR > 0.5 && EstRR < 1.25,
      C2: () => isDownCandle(lastestCandle),
      C3: () => candleStickData.slice(-10).every(candle => +candle[5] < avgVolume),
    };
  } else if (false) {
    if ((max2Range30 - lastestCandle[4]) / avgCandleBody <= 1.5) {
      type = "down";
      EstRR = (max2Range30 / lastestCandle[4] - 1) * 100 * 1.25;

      currentRR = 1;

      // condition
      CONDITIONS = {
        C1: () => EstRR > 0.5 && EstRR < 1.5,
        C2: () => isDownCandle(lastestCandle) && isDownCandle(prevCandle)
      };
    } else if ((lastestCandle[4] - min3Range30) / avgCandleBody <= 1.5) {
      type = "up";
      EstRR = (lastestCandle[4] / min3Range30 - 1) * 100 * 1.25;

      currentRR = 1;

      // condition
      CONDITIONS = {
        C1: () => EstRR > 0.5 && EstRR < 1.5,
        C2: () => isUpCandle(lastestCandle) && isUpCandle(prevCandle),
      };
    }
  }

  const isPassCondition =
    Object.values(CONDITIONS).length &&
    Object.values(CONDITIONS).every((cond) => cond());

  if (isPassCondition) {
    slPercent = EstRR;
    tpPercent = EstRR * currentRR;
    isAllowOrder = true;
    methodRR = currentRR;
    timeStamp = lastestCandle[0];
  }

  return {
    type,
    slPercent,
    isAbleOrder: isAllowOrder,
    timeStamp,
    entry: lastestCandle[4],
    tpPercent,
    methodRR,
    keyFn: "pattern_S4",
  };
};
