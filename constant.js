export const APP_CONFIG = {
  TOKEN: "6536748064:AAEd9oc61IwSI3cBqlmuv0IGwkd-Y6st54o",
  API_KEY: "16tXNcwM2ruf4shLnGhqnlPD4TDQQHJQqaRZgCRDEi51wAySkXxhQz2Xc9M4IORx",
  API_SECRET:
    "cagy3oI698pBYtdMxNU0Ane4w5ti4rGiv0s3yg4ClBhgTiIqgYZ8uS56x90N2Sdr",
  TOKEN_TEST: "7137015129:AAHxluTIbi3TpnUnht2jizx96hh-5OhF7aQ",
};

export const DOMAIN = {
  BINANCE: "https://api.binance.com",
  BINANCE_FUTURE: "https://fapi.binance.com",
};

export const ENDPOINT_TYPE = {
  fAPIv1: "fapi/v1",
  fAPIv2: "fapi/v2",
  fAPIv3: "fapi/v3",
};

export const COMMAND = {
  RUN: "run",
  STOP: "stop",
  BREAK_OUT: "break-out",
  RUN_TECHNICAL: "run-technical",
  BIG: "big",
  SAFE: "safe",
  TEST: "test",
  ORDER: "order",
  EXECUTE_BIG_PRICE: "execute-big-price",
  EXECUTE_BIG_PRICE_V2: "execute-big-price-v2",
  EXECUTE_SIMPLE_METHOD: "execute-simple-method",
  TEST_FUNCTION: "test-function",
  CHECK: 'check'
};

export const MESSAGE = {
  NO_COMMAND: "Không tìm thấy câu lệnh phù hợp, vui lòng thử lại!",
  NOTI_BOT_RUNNING: "Bot đang tiến hành chạy...",
};

export const TYPE_OF_PRICE = {
  OPEN: 1,
  HIGH: 2,
  LOW: 3,
  CLOSE: 4,
};

export const TEST_CONFIG = {
  account: 50, // balance
  limitOrder: 50, // số lệnh tối đa
  trackingTime: 15, // tgian call interval check account
  tpPercent: 1, // %
  slPercent: 1, // %
  volume: 20, // volume cho mỗi 1 lệnh
  limitVolume: 25, // volume cho phép tối đa  (use case khi tính quantity dẫn đến volume giao dịch của lệnh cao hơn volume khi setup)
  takeProfitEST: 0.94,
  stoplossEST: 0.26,
  orders: [], // => { symbol: BTCUSDT, entry: 29000, tp: 30000, sl: 27000, }
  mapLevelPow: {},
};

export const CONFIG_EXEC_BIG_PRICE = {
  limitOrder: 30,
  trackingTime: 15, // tgian call interval check account
  tpPercent: 1,
  slPercent: 1,
  volume: 20,
  limitVolume: 25,
  orders: [], // => { symbol: BTCUSDT, entry: 29000, tp: 30000, sl: 27000, }
  percentPullbackLowest: 55, // % cho phép giá pullback về tối thiểu để vào lệnh (dựa trên độ chênh lệch giá của nến tín hiệu)
  percentPullbackHighest: 100, // % cho phép giá pullback về tối đa
};
