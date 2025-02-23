export const CONFIG = {
  vol: 100,
  limitPeakOrBottom: 10,
  listCandleParamTesting: {
    limit: 1000, // limit cho get list candle
    range: [0, 1000], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  limitUnexpect: 10,
  limitMaxPercentOrder: 1.5, // 1
  limitMinPercentOrder: 0.3,
  limitFailCandle: 1, // 1
  gapPercent: 1, // 0.5
  candlePayload: {
    limit: 1000,
  }
};
