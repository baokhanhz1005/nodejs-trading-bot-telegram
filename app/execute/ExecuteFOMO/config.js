export const CONFIG_QUICK_TRADE = {
  RR: 1,
  COST: 0.5,
  RATE_SL: 1.5, // default = 3
  limitPeakOrBottom: 10,
  RR_MANUAL_ORDER: 0.5,

  // for backtest
  listCandleParamTesting: {
    limit: 400, // limit cho get list candle
    range: [0, 300], // slice trong range chỉ định [x, y]
    isUseRange: false, // có sử dụng range hay không
  },
  isSpecificTime: true,
  // isShowSL: true,
  rangeTime: 1742007601000, // comment its when no use
  // rangeTime: 1743562801000, // comment its when no use
  // loopData: 40,

  // hit SL mode
  // isHitSLMode: true,
  // limitHitSL: 1,
  
  // ---------- level pow ------------
  isLevelPow: false,
  maxLevelPow: 4,

  excludeTimeStamp: [
    // EXCLUDE TIME STAMP TO DEBUG
    // "1742887800000",
  ],
};
