import { buildLinkToSymbol, buildTimeStampToDate } from "../../../utils.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";
import { CONFIG } from "./configs.js";
import { initMarkInfo } from "./utils.js";

const { limitFailCandle, vol } = CONFIG;

export const ForeCastMethodTrailing = (data) => {
  const { candleStickData = [], method = {}, isOtherMethod = false } = data;

  const { methodFn, config } = method;

  const { rangeCandleInfo, symbol } = config;
  let listCandleInfo = [];
  let currentCandle = [];
  let index = 0;
  const dataForeCast = {
    countOrders: 0,
    winOrder: 0,
    loseOrder: 0,
    longOrders: 0,
    shortOrders: 0,
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

      handleTrailingMethod({
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

const handleTrailingMethod = ({
  listCandleInfo,
  currentCandle,
  dataForeCast,
  methodFn,
  symbol,
}) => {
  const { isMarked, markType, data } = dataForeCast.markInfo;
  if (dataForeCast.orderInfo) {
    // handle run trailing here
    const { type, entry, failCandle, slPrice, timeStamp, countUnexpect, data } =
      dataForeCast.orderInfo;

    if (type === "up") {
      if (currentCandle[3] <= slPrice) {
        dataForeCast.info.push(
          `${timeStamp}-${buildTimeStampToDate(
            timeStamp
          )} - ${buildLinkToSymbol(symbol)} - LONG - ${countUnexpect}\n`
        );
        handleCloseOrder(dataForeCast, slPrice, type, symbol);
      } else if (isUpCandle(currentCandle)) {
        if (currentCandle[4] >= entry) {
          dataForeCast.orderInfo = {
            ...dataForeCast.orderInfo,
            failCandle: failCandle > 0 ? failCandle - 1 : 0,
          };
        } else {
          dataForeCast.orderInfo.failCandle = 0;
        }
      } else if (isDownCandle(currentCandle)) {
        if (currentCandle[4] > entry && failCandle === limitFailCandle) {
          const closePrice = currentCandle[4];
          handleCloseOrder(dataForeCast, closePrice, type, symbol);
        } else if (currentCandle[4] >= entry) {
          dataForeCast.orderInfo = {
            ...dataForeCast.orderInfo,
            failCandle: failCandle + 1,
          };
        } else if (currentCandle[4] < entry) {
          dataForeCast.orderInfo.failCandle = 0;
        }
      }
    } else if (type === "down") {
      if (currentCandle[2] >= slPrice) {
        dataForeCast.info.push(
          `${timeStamp}-${buildTimeStampToDate(
            timeStamp
          )} - ${buildLinkToSymbol(symbol)} - SHORT - ${countUnexpect}\n`
        );
        handleCloseOrder(dataForeCast, slPrice, type, symbol);
      } else if (isDownCandle(currentCandle)) {
        if (currentCandle[4] <= entry) {
          dataForeCast.orderInfo = {
            ...dataForeCast.orderInfo,
            failCandle: failCandle > 0 ? failCandle - 1 : 0,
          };
        } else {
          dataForeCast.orderInfo.failCandle = 0;
        }
      } else if (isUpCandle(currentCandle)) {
        if (currentCandle[4] < entry && failCandle === limitFailCandle) {
          const closePrice = currentCandle[4];
          handleCloseOrder(dataForeCast, closePrice, type, symbol);
        } else if (currentCandle[4] <= entry) {
          dataForeCast.orderInfo = {
            ...dataForeCast.orderInfo,
            failCandle: failCandle + 1,
          };
        } else if (currentCandle[4] > entry) {
          dataForeCast.orderInfo.failCandle = 0;
        }
      }
    }
  } else if (isMarked) {
    const {
      markInfo,
      isAbleOrder,
      type,
      slPercent,
      entry,
      timeStamp,
      countUnexpect,
    } = methodFn(listCandleInfo, dataForeCast.markInfo);

    if (isAbleOrder) {
      const slPrice =
        type === "up"
          ? entry * (1 - slPercent / 100)
          : entry * (1 + slPercent / 100);

      const orderInfo = {
        slPercent,
        entry,
        type,
        failCandle: 0,
        slPrice,
        timeStamp,
        countUnexpect,
      };
      dataForeCast.countOrders += 1;
      if (type === "up") {
        dataForeCast.longOrders += 1;
      } else {
        dataForeCast.shortOrders += 1;
      }
      dataForeCast.orderInfo = orderInfo;
      dataForeCast.markInfo = initMarkInfo();
    } else {
      dataForeCast.markInfo = markInfo;
    }
  } else {
    const data = methodFn(listCandleInfo) || {};
    dataForeCast.markInfo = data;
  }
};

export const handleCloseOrder = (dataForeCast, closePrice, type, symbol) => {
  const { orderInfo } = dataForeCast;
  const { entry } = orderInfo;
  let isTp = false;
  switch (type) {
    case "up": {
      const rateExchange = +closePrice / +entry - 1;
      const profit = vol * rateExchange - (vol * 0.1) / 100;

      if (rateExchange >= 0) {
        dataForeCast.winOrder += 1;
        dataForeCast.profit += profit;
        isTp = true;
      } else {
        dataForeCast.loseOrder += 1;
        dataForeCast.profit += profit;
        // console.log(profit);
      }

      dataForeCast.orderInfo = null;
      break;
    }

    case "down": {
      const rateExchange = entry / closePrice - 1;
      const profit = vol * rateExchange - (vol * 0.1) / 100;

      if (rateExchange >= 0) {
        dataForeCast.winOrder += 1;
        dataForeCast.profit += profit;
        isTp = true;
      } else {
        dataForeCast.loseOrder += 1;
        dataForeCast.profit += profit;
      }
      dataForeCast.orderInfo = null;

      break;
    }

    default:
      break;
  }

  // console.log(symbol, dataForeCast.profit, isTp ? "tppppppp" : "");
};
