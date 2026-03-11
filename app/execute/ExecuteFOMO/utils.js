import {
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

  const EMA200 = getEMA(200, candleStickData.slice(-200));
  // const EMA100 = getEMA(100, candleStickData.slice(-100));
  const EMA50 = getEMA(50, candleStickData.slice(-50));
  const EMA20 = getEMA(20, candleStickData.slice(-20));

  // const min3Range10 = getMinOnListCandle(candleStickData.slice(-10), 3);
  // const max4Range10 = getMaxOnListCandle(candleStickData.slice(-10), 4);

  const min3Range15 = getMinOnListCandle(candleStickData.slice(-15), 3);
  const max2Range15 = getMaxOnListCandle(candleStickData.slice(-15), 2);
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
  // const min4Range15 = getMinOnListCandle(candleStickData.slice(-15), 4);

  // const min3Range30 = getMinOnListCandle(candleStickData.slice(-30), 3);
  // const max2Range30 = getMaxOnListCandle(candleStickData.slice(-30), 2);
  // const min4Range30 = getMinOnListCandle(candleStickData.slice(-30), 4);
  // const max4Range30 = getMaxOnListCandle(candleStickData.slice(-30), 4);

  const max4Range50 = getMaxOnListCandle(candleStickData.slice(-50), 4);
  const min4Range50 = getMinOnListCandle(candleStickData.slice(-50), 4);
  // const min3Range50 = getMinOnListCandle(candleStickData.slice(-50), 3);

  // const min4Range100 = getMinOnListCandle(candleStickData.slice(-100), 4);
  // const max4Range100 = getMaxOnListCandle(candleStickData.slice(-100), 4);

  // const max4Range0To50 = getMinOnListCandle(candleStickData.slice(0, 50), 4);

  const avgCandleBody =
    candleStickData.slice(-50).reduce((acc, candle) => {
      return (acc += Math.abs(+candle[1] - +candle[4]));
    }, 0) / 50;
  // const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);

  const { maxContinueDown, maxContinueUp } = findContinueSameTypeCandle(
    candleStickData.slice(-15),
  );

  const lookback = 100;

  const listHighest = getListHighest(candleStickData.slice(-lookback), 8, 2);
  const listLowest = getListLowest(candleStickData.slice(-lookback), 8, 2);

  const highs = listHighest.map((p) => p.price);
  const lows = listLowest.map((p) => p.price);

  const trend = classifyTrend(highs, lows, 2, 0.999);

  const RANGE_EXCHANGE_LEVEL = (max4Range50 - min4Range50) / avgCandleBody;
  let currentRR = 3;

  if (RANGE_EXCHANGE_LEVEL <= 10) {
    CONDITIONS = {};
  } else if (trend === TREND.UP) {
    EstRR = (lastestCandle[4] / min3Range15 - 1) * 100 * 1.8;
    type = "up";
    // condition
    CONDITIONS = {
      COND_1: () => EstRR > 0.6 && EstRR < 1.8,
      COND_2: () =>
        candleStickData.slice(-5).some(
          (candle) =>
            (+candle[3] < +EMA20 &&
              candleStickData.slice(-10).every((cand) => cand[4] > EMA20)) ||
            (+candle[3] < +EMA50 &&
              candleStickData.slice(-10).every((cand) => cand[4] > EMA50)),
          //   ||
          // (+candle[2] > +EMA100 &&
          //   candleStickData.slice(-10).every((cand) => cand[4] < EMA100)),
        ),
      COND_3: () => EMA20 > EMA50 && EMA50 > EMA200,
      COND_4: () => checkFullCandle(lastestCandle, "up", avgCandleBody),
    };
  } else if (trend === TREND.DOWN) {
    EstRR = (max2Range15 / lastestCandle[4] - 1) * 100 * 1.8;
    type = "down";
    // condition
    CONDITIONS = {
      COND_1: () => EstRR > 0.6 && EstRR < 1.8,
      COND_2: () =>
        candleStickData.slice(-5).some(
          (candle) =>
            (+candle[2] > +EMA20 &&
              candleStickData.slice(-10).every((cand) => cand[4] < EMA20)) ||
            (+candle[2] > +EMA50 &&
              candleStickData.slice(-10).every((cand) => cand[4] < EMA50)),
          //   ||
          // (+candle[2] > +EMA100 &&
          //   candleStickData.slice(-10).every((cand) => cand[4] < EMA100)),
        ),
      COND_3: () => EMA20 < EMA50 && EMA50 < EMA200,
      COND_4: () => checkFullCandle(lastestCandle, "down", avgCandleBody),
    };
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
    keyFn: "pattern_S3",
  };
};
