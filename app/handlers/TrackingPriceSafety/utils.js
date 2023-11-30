import {
  checkExchangeBigPrice,
  isMarubozu,
} from "../TrackingEngulfing/utils.js";

export const checkSafetyPrice = (candleStickData, symbol) => {
  const result = {
    isHasBigPrice: false,
    level: 0,
    type: "",
    isBuySellSafety: false,
  };

  candleStickData.every((candle, index) => {
    if (index > 0 && index <= 5) {
      const candleCurrent = candle;
      const candlePreviousCurrent = candleStickData[index + 1];

      const { isHasExchangeBigPrice, type } = checkExchangeBigPrice(
        candleCurrent,
        candlePreviousCurrent
      );
      const isMarubozuCandle = isMarubozu(candleCurrent, type);
      const isCurrentEngulfing = isMarubozuCandle;
      const detalChangePercent = Math.abs(
        1 - candleCurrent[4] / candleCurrent[1]
      ) * 100;

      if (isCurrentEngulfing && detalChangePercent > 1) {
        for (let i = index; i < candleStickData.length; i++) {
          let candlePriceCheck = candleStickData[i + 1];
          if (
            // trace những candle phía sau tính từ candle đã phát hiện nến engulffing
            candlePriceCheck &&
            ((type === "up" &&
              candleCurrent[4] > candlePriceCheck[4] * 1.005) ||
              (type === "down" &&
                candleCurrent[4] < candlePriceCheck[4] * 0.995))
          ) {
            result.level += 1;
            result.type = type;
            result.isHasBigPrice = true;
          }
        }

        if (result.level >= 1) {
          const isPullBack = checkIsPullBack(
            candleCurrent,
            candleStickData[0],
            type,
            symbol
          );
          const lastestCandle = candleStickData[0];
          const exChangePriceCandle = lastestCandle[4] - lastestCandle[1];
          const isHasRecoveryCandle = type === 'up' ? exChangePriceCandle > 0 : exChangePriceCandle < 0;
          result.isBuySellSafety = isPullBack;
          result.index = index;
        }

        return false; // break loop
      }
      return true; // continue loop
    }
    return true; // break loop
  });

  return result;
};

export const checkIsPullBack = (candlePoint, candleLatest, type, symbol) => {
  let delta = candlePoint[4] - candleLatest[4];
  if (type === "up") {
    return delta > 0 && candlePoint[1] < candleLatest[4];
  } else if (type === "down") {
    return delta < 0 && candlePoint[1] > candleLatest[4];
  } else {
    return false;
  }
};
