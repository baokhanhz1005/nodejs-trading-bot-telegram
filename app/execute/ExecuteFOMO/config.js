export const CONFIG_QUICK_TRADE = {
  RR: 1.75,
  COST: 1,
  RATE_SL: 5, // default = 3
  listCandleParamTesting: {
    limit: 300, // limit cho get list candle
    range: [0, 300], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  limitPeakOrBottom: 10,
};
