export const CONFIG_QUICK_TRADE = {
  RR: 0.5,
  COST: 1,
  RATE_SL: 1.5, // default = 3
  limitPeakOrBottom: 10,
  RR_MANUAL_ORDER: 1,

  // for backtest
  listCandleParamTesting: {
    limit: 300, // limit cho get list candle
    range: [0, 300], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  isSpecificTime: false,
  isShowSL: true,
  // rangeTime: 1741050001000,  // comment its when no use
};
