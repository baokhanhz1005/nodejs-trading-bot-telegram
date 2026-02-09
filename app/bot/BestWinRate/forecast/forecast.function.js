import { buildLinkToSymbol, buildTimeStampToDate } from "../../../../utils.js";

const SETTING_FORECAST = {
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
  rangeTime: 1758067260000, // comment its when no use
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

const { RR, COST, isLevelPow, maxLevelPow, isHitSLMode, limitHitSL } =
  SETTING_FORECAST;

const MAX_LOST = 3;

export const ForeCastFunction = (data) => {
  const {
    candleStickData = [],
    method = {},
    isOtherMethod = false,
    typeCheck,
  } = data;

  const { methodFn, config } = method;

  const { rangeCandleInfo, symbol } = config;
  let listCandleInfo = [];
  let currentCandle = [];
  let index = 0;
  const dataForeCast = {
    countOrders: 0,
    longOrders: 0,
    shortOrders: 0,
    countTP: 0,
    countSL: 0,
    orderInfo: null,
    profit: 0,
    infoSL: [],
    infoTP: [],
    markInfo: {
      isMarked: false,
      markType: "",
      data,
    },
    levelPow: 0,
    currentHitSL: 0,
    allowLost: MAX_LOST,
  };

  if (rangeCandleInfo && candleStickData.length > rangeCandleInfo) {
    for (let i = 0 + rangeCandleInfo; i < candleStickData.length; i++) {
      listCandleInfo = candleStickData.slice(index, i);
      currentCandle = listCandleInfo.slice(-2)[0];
      index += 1;

      handleFOMOMethod({
        listCandleInfo,
        currentCandle,
        dataForeCast,
        methodFn,
        symbol,
        typeCheck,
      });
    }
  }
  return dataForeCast;
};

const handleFOMOMethod = ({
  listCandleInfo,
  currentCandle,
  dataForeCast,
  methodFn,
  symbol,
  typeCheck,
}) => {
  listCandleInfo.pop();
  if (dataForeCast.allowLost <= 0 && !dataForeCast.orderInfo) return;

  if (dataForeCast.orderInfo) {
    // handle run trailing here
    const {
      entry,
      tp,
      sl,
      type,
      timeStamp,
      percent,
      funding,
      methodRR,
      // levelPow,
    } = dataForeCast.orderInfo;

    const levelPow = dataForeCast.levelPow;
    const currentHitSL = dataForeCast.currentHitSL;
    const maxCurrentPrice = currentCandle[2];
    const minCurrentPrice = currentCandle[3];

    const currentRR = methodRR || RR;

    const profit = currentRR * COST * Math.pow(2, levelPow) - funding;
    const lost = -(COST * Math.pow(2, levelPow) + funding);

    if (type === "up" && minCurrentPrice <= sl) {
      dataForeCast.infoSL.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol,
        )} - LONG\n`,
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      if (isLevelPow) {
        dataForeCast.levelPow = levelPow + 1 >= maxLevelPow ? 0 : levelPow + 1;
      }
      dataForeCast.orderInfo = null;
      dataForeCast.currentHitSL = 0;
      dataForeCast.allowLost -= 1;
    } else if (type === "down" && maxCurrentPrice >= sl) {
      dataForeCast.infoSL.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol,
        )} - SHORT\n`,
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      if (isLevelPow) {
        dataForeCast.levelPow = levelPow + 1 >= maxLevelPow ? 0 : levelPow + 1;
      }
      dataForeCast.orderInfo = null;
      dataForeCast.currentHitSL = 0;
      dataForeCast.allowLost -= 1;
    } else if (type === "up" && maxCurrentPrice >= tp) {
      // if (dataForeCast.orderInfo.minPrice < dataForeCast.orderInfo.avgPrice) {
      dataForeCast.infoTP.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol,
        )} - LONG\n`,
      );
      dataForeCast.countTP += 1;
      dataForeCast.profit += profit;
      dataForeCast.levelPow = 0;
      // }
      dataForeCast.currentHitSL = limitHitSL + 1;
      dataForeCast.orderInfo = null;
      if (dataForeCast.allowLost < MAX_LOST) {
        dataForeCast.allowLost += 1;
      }
    } else if (type === "down" && minCurrentPrice <= tp) {
      // if (dataForeCast.orderInfo.maxPrice > dataForeCast.orderInfo.avgPrice) {
      dataForeCast.infoTP.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol,
        )} - SHORT\n`,
      );
      dataForeCast.countTP += 1;
      dataForeCast.profit += profit;
      dataForeCast.levelPow = 0;
      // }
      dataForeCast.orderInfo = null;
      dataForeCast.currentHitSL = limitHitSL + 1;
      if (dataForeCast.allowLost < MAX_LOST) {
        dataForeCast.allowLost += 1;
      }
    }
  } else {
    const {
      type,
      symbol: symbolOrder,
      isAbleOrder = false,
      tpPercent,
      slPercent,
      entry,
      timeStamp,
      methodRR,
    } = methodFn(listCandleInfo, symbol, typeCheck) || {};

    if (isAbleOrder && (type === "up" || type === "down")) {
      const ratePriceTP =
        type === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
      const ratePriceSL =
        type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

      const newOrder = {
        symbol,
        entry,
        tp: ratePriceTP * entry,
        sl: ratePriceSL * entry,
        type,
        timeStamp,
        percent: slPercent,
        funding: (COST * 0.1 * Math.pow(2, dataForeCast.levelPow)) / slPercent,
        maxPrice: +entry,
        minPrice: +entry,
        avgPrice: +entry + (ratePriceSL * +entry - +entry) * 0.5,
        methodRR,
        // levelPow: dataForeCast.levelPow,
      };

      dataForeCast.orderInfo = newOrder;
      dataForeCast.countOrders += 1;

      if (type === "up") {
        dataForeCast.longOrders += 1;
      } else {
        dataForeCast.shortOrders += 1;
      }
    }
  }
};
