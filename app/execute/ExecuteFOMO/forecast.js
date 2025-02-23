import { buildLinkToSymbol, buildTimeStampToDate } from "../../../utils.js";
import { CONFIG_QUICK_TRADE } from "./config.js";

const { RR, COST } = CONFIG_QUICK_TRADE;

export const ForeCastMethodFOMO = (data) => {
  const { candleStickData = [], method = {}, isOtherMethod = false } = data;

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
    info: [],
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
}) => {
  if (dataForeCast.orderInfo) {
    // handle run trailing here
    const { entry, tp, sl, type, timeStamp, percent, funding } =
      dataForeCast.orderInfo;

    const maxCurrentPrice = currentCandle[2];
    const minCurrentPrice = currentCandle[3];

    const profit = RR * COST - funding;
    const lost = -(COST + funding);

    if (type === "up" && minCurrentPrice <= sl) {
      dataForeCast.info.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - LONG\n`
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      dataForeCast.orderInfo = null;
    } else if (type === "down" && maxCurrentPrice >= sl) {
      dataForeCast.info.push(
        `${timeStamp}-${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - SHORT\n`
      );
      dataForeCast.countSL += 1;
      dataForeCast.profit += lost;
      dataForeCast.orderInfo = null;
    } else if (type === "up" && maxCurrentPrice >= tp) {
      dataForeCast.countTP += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.profit += profit;
    } else if (type === "down" && minCurrentPrice <= tp) {
      dataForeCast.countTP += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.profit += profit;
    }
  } else {
    listCandleInfo.pop();

    const {
      type,
      symbol,
      isAbleOrder = false,
      tpPercent,
      slPercent,
      timeStamp,
    } = methodFn(listCandleInfo) || {};

    const typeOrder = type;

    if (isAbleOrder && (type === "up" || type === "down")) {
      const price = currentCandle[1];
      const ratePriceTP =
        typeOrder === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
      const ratePriceSL =
        typeOrder === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;
      const newOrder = {
        symbol,
        entry: +price,
        tp: ratePriceTP * price,
        sl: ratePriceSL * price,
        type: typeOrder,
        timeStamp,
        percent: slPercent,
        funding: (COST * 0.1) / slPercent,
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
