export const CONFIG_QUICK_TRADE = {
  RR: 0.7,
  COST: 3,
  RATE_SL: 2.5, // default = 3
  listCandleParamTesting: {
    limit: 1000, // limit cho get list candle
    range: [0, 1000], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  limitPeakOrBottom: 10
};
