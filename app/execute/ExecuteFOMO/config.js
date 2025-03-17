export const CONFIG_QUICK_TRADE = {
  RR: 2,
  COST: 2,
  RATE_SL: 1.5, // default = 3
  listCandleParamTesting: {
    limit: 300, // limit cho get list candle
    range: [0, 300], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  limitPeakOrBottom: 10,
};
