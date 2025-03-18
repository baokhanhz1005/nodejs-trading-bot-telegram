import { buildLinkToSymbol, buildTimeStampToDate } from "../../../utils.js";
import { CONFIG_QUICK_TRADE } from "./config.js";

const { RR, COST } = CONFIG_QUICK_TRADE;

export const ForeCastMethodFOMO = (data) => {
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
  if (dataForeCast.orderInfo) {
    // handle run trailing here
    const { entry, tp, sl, type, timeStamp, percent, funding } =
      dataForeCast.orderInfo;

    const maxCurrentPrice = currentCandle[2];
    const minCurrentPrice = currentCandle[3];

    const profit = RR * COST - funding;
    const lost = -(COST + funding);

    if (type === "up" && minCurrentPrice <= sl) {
      dataForeCast.infoSL.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - LONG\n`
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      dataForeCast.orderInfo = null;
    } else if (type === "down" && maxCurrentPrice >= sl) {
      dataForeCast.infoSL.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - SHORT\n`
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      dataForeCast.orderInfo = null;
    } else if (type === "up" && maxCurrentPrice >= tp) {
      // if (dataForeCast.orderInfo.minPrice < dataForeCast.orderInfo.avgPrice) {
        dataForeCast.infoTP.push(
          `${timeStamp}-${buildTimeStampToDate(
            timeStamp
          )} - ${buildLinkToSymbol(symbol)} - LONG\n`
        );
        dataForeCast.countTP += 1;
        dataForeCast.profit += profit;
      // }
      dataForeCast.orderInfo = null;
    } else if (type === "down" && minCurrentPrice <= tp) {
      // if (dataForeCast.orderInfo.maxPrice > dataForeCast.orderInfo.avgPrice) {
        dataForeCast.infoTP.push(
          `${timeStamp}-${buildTimeStampToDate(
            timeStamp
          )} - ${buildLinkToSymbol(symbol)} - SHORT\n`
        );
        dataForeCast.countTP += 1;
        dataForeCast.profit += profit;
      // }
      dataForeCast.orderInfo = null;
    } else {
      dataForeCast.orderInfo.maxPrice =
        dataForeCast.orderInfo.maxPrice < maxCurrentPrice
          ? maxCurrentPrice
          : dataForeCast.orderInfo.maxPrice;

      dataForeCast.orderInfo.minPrice =
        dataForeCast.orderInfo.minPrice > minCurrentPrice
          ? minCurrentPrice
          : dataForeCast.orderInfo.minPrice;
    }
  } else {
    const {
      type,
      symbol,
      isAbleOrder = false,
      tpPercent,
      slPercent,
      entry,
      timeStamp,
    } = methodFn(listCandleInfo, "", typeCheck) || {};

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
        funding: (COST * 0.1) / slPercent,
        maxPrice: +entry,
        minPrice: +entry,
        avgPrice: (+entry + ratePriceSL * +entry) / 2,
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
