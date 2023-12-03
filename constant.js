export const APP_CONFIG = {
  TOKEN: "6536748064:AAEd9oc61IwSI3cBqlmuv0IGwkd-Y6st54o",
  API_KEY: '16tXNcwM2ruf4shLnGhqnlPD4TDQQHJQqaRZgCRDEi51wAySkXxhQz2Xc9M4IORx',
  API_SECRET: 'cagy3oI698pBYtdMxNU0Ane4w5ti4rGiv0s3yg4ClBhgTiIqgYZ8uS56x90N2Sdr'
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
  BIG: 'big',
  SAFE: 'safe',
  TEST: 'test',
  ORDER: 'order',
  EXECUTE_BIG_PRICE: 'execute-big-price'
};

export const MESSAGE = {
  NO_COMMAND: "Không tìm thấy câu lệnh phù hợp, vui lòng thử lại!",
  NOTI_BOT_RUNNING: "Bot đang tiến hành chạy...",
};

export const TEST_CONFIG = {
  account: 50,
  limitOrder: 30,
  trackingTime: 15, // tgian call interval check account
  tpPercent: 0.5,
  slPercent: 3,
  volume: 20,
  limitVolume: 25,
  orders: [], // => { symbol: BTCUSDT, entry: 29000, tp: 30000, sl: 27000, }
}

export const CONFIG_EXEC_BIG_PRICE = {
  limitOrder: 30,
  trackingTime: 15, // tgian call interval check account
  tpPercent: 0.5,
  slPercent: 3,
  volume: 20,
  limitVolume: 25,
  orders: [], // => { symbol: BTCUSDT, entry: 29000, tp: 30000, sl: 27000, }
}