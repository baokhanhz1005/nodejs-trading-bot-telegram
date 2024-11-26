export const RR = 1.2;
export const REWARD = 0.25;
export const MINIMUM_PERCENT_ORDER = 0.3;
export const LIMIT_ORDER = Math.ceil((REWARD * 100) / MINIMUM_PERCENT_ORDER);
export const COST = (0.1 * Math.ceil((REWARD * 100) / 0.83)) / 100;

export const INPUT_CONTROL = {
  RR: 1,    // lợi nhuận/ rủi ro
  REWARD: 1,      // chi phí 1 lệnh
  orderConfig: {
    rateOrder: 2,    // hệ số mở rộng để giảm margin lệnh đó
  },
  similarConfig: {
    rateSimilar: 6,     // hệ số mở rộng SL của lệnh mô phỏng
    maxRangeCheck: 75,   // giới hạn chờ hit SL của lệnh mô phỏng cho mỗi cây nến
  },
  reOrderSimilar: {
    rateReOrder: 0.5,    // hệ số mở rộng SL cho lệnh SL với xu hướng tăng.giảm mạnh
  },
  methodFn: {
    rate: 1.5,    // hệ số nhân của mô hình nến detect để vào lệnh
  },
  listCandleParamTesting: {
    limit: 1000,      // limit cho get list candle
    range: [0, 1000],       // slice trong range chỉ định [x, y]
    isUseRange: false,      // có sử dụng range hay không
  },
  limitPeakOrBottom: 10,  // số candle đc tạo nên thành 1 đỉnh || đáy  (1 nến có giá đóng cửa lớn/bé hơn n số candle trc và sau, với n là limitPeakOrBottom)
  isLevelPow: false,
  isRunSingle: false,
};
