import { checkEngulfing, isMarubozu } from "../TrackingEngulfing/utils.js";

export const checkHasBigPriceTrend = (dataCandle) => {
  const result = {
    isHasBigPrice: false,
    level: 0,
    type: "",
  };
  if (dataCandle && dataCandle.length) {
    const lengthDataCandle = dataCandle.length - 1;
    const dataCandleCheck = dataCandle[lengthDataCandle];
    const { isEngulfing, type } = checkEngulfing(
      dataCandleCheck,
      dataCandle[lengthDataCandle - 1]
    );
    const isMarubozuCandle = isMarubozu(dataCandleCheck, type);
    for (let i = 0; i < dataCandle.length; i++) {
      const candle = dataCandle[lengthDataCandle - i];
      if (i !== 0 && isMarubozuCandle) {
        if (
          (type === "up" && dataCandleCheck[4] > candle[4] * 1.005) ||
          (type === "down" && dataCandleCheck[4] < candle[4] * 0.995)
        ) {
          result.isHasBigPrice = true;
          result.level += 1;
          result.type = type;
        } else {
          break;
        }
      }
    }
  }
  return result;
};
