import { REWARD, RR } from "../app/execute/ExecuteSMC/constant.js";
import { TYPE_OF_PRICE } from "../constant.js";
import { buildLinkToSymbol, buildTimeStampToDate } from "../utils.js";
import { checkInRange, isDownCandle, isUpCandle } from "./TypeCandle.js";

export const detectTrendPrice = (listCandle) => {};

export const handleByTrend = (listCandle, type) => {
  if (type === "up") {
  } else if (type === "down") {
  } else if (type === "side-way") {
  }
};

export const isIntoRangePrice = (
  priceCurrent,
  priceCheck,
  range = 0.5,
  typeRange
) => {};

export const getListSupportRestricted = (listCandle) => {
  const data = {
    supports: [],
    restricted: [],
  };

  const maxInfo = {
    value: listCandle[0][4],
    process: 0,
    isWaiting: false,
  };

  const minInfo = {
    value: listCandle[0][4],
    process: 0,
    isWaiting: false,
  };

  const processForCheck = 3;

  // kiểm tra nến theo thứ tự từ mới nhất ==> cũ nhất
  // cơ chế xác định, ví dụ khi đã tìm vùng giá cao nhất thì chờ cho đến khi tìm đc vùng giá thấp nhất và lặp đi lặp lại
  // ước lượng nếu có khoảng 4 cây nến trc đó không lớn hơn/ bé hơn cây nến đang kiểm tra ==> đó là đỉnh / đáy
  for (let i = 0; i < listCandle.length; i++) {
    const candle = listCandle[i];
    const priceCheck = candle[4];

    // MAX
    if (!maxInfo.isWaiting && priceCheck >= maxInfo.value) {
      maxInfo.value = priceCheck;
      maxInfo.process = 0;
    } else if (maxInfo.process + 1 === processForCheck) {
      data.restricted.push(maxInfo.value);
      maxInfo.process = 0;
      maxInfo.isWaiting = true;
      minInfo.value = priceCheck;

      if (minInfo.isWaiting) {
        minInfo.isWaiting = false;
      }
    } else {
      maxInfo.process += 1;
    }

    // MIN
    if (!minInfo.isWaiting && priceCheck <= minInfo.value) {
      minInfo.value = priceCheck;
      minInfo.process = 0;
    } else {
      minInfo.process += 1;
    }

    if (minInfo.process === processForCheck) {
      data.supports.push(minInfo.value);
      minInfo.process = 0;
      minInfo.isWaiting = true;
      maxInfo.value = priceCheck;
      if (maxInfo.isWaiting) {
        maxInfo.isWaiting = false;
      }
    }
  }

  return data;
};

export const checkTrendLine = (listCandle, period = 15) => {
  let result = "";
  let model = "";
  const minMaxPeriod = [];
  if (listCandle && listCandle.length) {
    listCandle.forEach((candle, idx) => {
      let index = Math.floor(idx / period);
      if (index < 3) {
        if (!minMaxPeriod[index]) {
          minMaxPeriod[index] = [candle];
        } else {
          minMaxPeriod[index].push(candle);
        }
      }
    });
  }
  const group = minMaxPeriod.map((period) => {
    const max = Math.max(...period.map((candle) => parseFloat(candle[4])));
    const min = Math.min(...period.map((candle) => parseFloat(candle[4])));
    return { max, min };
  });

  const max2 = group[2].max;
  const max1 = group[1].max;
  const max0 = group[0].max;

  const listMax = [max0, max1, max2];
  const listMin = [group[0].min, group[1].min, group[2].min];

  if (max2 < max1 && max1 < max0) {
    result = "up";
    model = 1;
  } else if (max2 >= max1 && max0 > max2) {
    result = "up";
    model = 2;
  }
  // else if (max2 < max1 && max1 * 0.992 <= max0) {
  //   result = "up";
  //   model = 3;
  // }

  // DOWN
  else if (max2 > max1 && max1 > max0) {
    result = "down";
    model = 1;
  } else if (max2 > max1 && checkInRange(max1, max0, 0.4)) {
    result = "down";
    model = 2;
  } else if (checkInRange(max2, max1, 0.4) && max1 > max0) {
    result = "down";
    model = 3;
  } else if (max2 < max1 && max0 < max2) {
    result = "down";
    model = 4;
  } else if (max2 < max1 && max0 > max2 && max0 < max1) {
    result = "down";
    model = 5;
  } else if (max2 > max1 && max0 > max1 && max0 < max2) {
    result = "down";
    model = 6;
  }

  // SIDE WAY
  else {
    result = "side-way";
    model = 0;
  }

  return { trend: result, model, listMax, listMin };
};

export const getMinMaxRangePeriod = (
  candleStickData,
  groupCandle = 3,
  range = 15,
  minMaxType = ""
) => {
  const minMaxPeriod = [];
  if (candleStickData && candleStickData.length) {
    candleStickData.forEach((candle, idx) => {
      let index = Math.floor(idx / range);
      if (index < groupCandle) {
        if (!minMaxPeriod[index]) {
          minMaxPeriod[index] = [candle];
        } else {
          minMaxPeriod[index].push(candle);
        }
      }
    });
  }
  const group = minMaxPeriod.map((period) => {
    const max = Math.max(...period.map((candle) => parseFloat(candle[4])));
    const min = Math.min(...period.map((candle) => parseFloat(candle[4])));
    if (!minMaxType) {
      return { max, min };
    } else if (minMaxType === "max") {
      return max;
    } else if (minMaxType === "min") {
      return min;
    }
  });

  return group;
};

export const rateUpAndDown = (listCandle, position = 1, isCheck = true) => {
  let countUp = 0;
  let countDown = 0;
  const rateInfo = {
    min: "",
    max: "",
  };

  const listRate = [];

  if (isCheck) {
    listCandle.forEach((candle, index) => {
      if (index < listCandle.length - 100) {
        const listCandlePayload = listCandle.slice(index, index + 51);
        const { rate } = rateUpAndDown(listCandlePayload, 1, 0);
        listRate.push(rate);
      }
    });
    rateInfo.min = Math.min(...listRate);
    rateInfo.max = Math.max(...listRate);
  } else {
    listCandle.forEach((candle, index) => {
      if (index >= position - 1) {
        if (isUpCandle(candle)) {
          countUp += 1;
        } else if (isDownCandle(candle)) {
          countDown += 1;
        }
      }
    });
  }

  const rate = countUp / (listCandle.length - position);
  return { countUp, countDown, rate, rateInfo };
};

export const ForeCastMethod = (data) => {
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
    orderInfo: null,
    orderSimilar: null,
    countSimilar: 0,
    info: [],
    percent: 0,
    count: 0,
    cost: 0,
    countLong: 0,
    countShort: 0,
    // orther method
    levelPow: 0,
    isLoseFullPow: false,
    profit: 0,
    maxLevelPow: 0,
  };

  if (rangeCandleInfo && candleStickData.length > rangeCandleInfo) {
    for (let i = 0 + rangeCandleInfo; i < candleStickData.length; i++) {
      // mảng này dùng cho phân tích nếu methodFn yêu cầu lấy dữ liệu nến trc đó để phân tích, ex: xu hướng ??, đảo chiểu ??
      listCandleInfo = candleStickData.slice(index, i);
      currentCandle = candleStickData[i - 1];
      index += 1;
      if (isOtherMethod) {
        if (dataForeCast.maxLevelPow < dataForeCast.levelPow) {
          dataForeCast.maxLevelPow = dataForeCast.levelPow;
        }
        if (dataForeCast.levelPow > 8) {
          dataForeCast.isLoseFullPow = true;
          dataForeCast.levelPow = 0;
          break;
        }
        handleOtherMethod(
          listCandleInfo,
          currentCandle,
          dataForeCast,
          methodFn,
          symbol
        );
      } else {
        handleData(
          listCandleInfo,
          currentCandle,
          dataForeCast,
          methodFn,
          symbol
        );
      }
    }
  }
  return dataForeCast;
};

const handleData = (
  listCandleInfo,
  currentCandle,
  dataForeCast,
  methodFn,
  symbol
) => {
  const updateOrder = (dataForeCast, currentCandle) => {
    let { sl, tp, type, timeStamp, percent, cost } = dataForeCast.orderSimilar;
    const price = currentCandle[4];

    let typeOrder = type;
    // let typeOrder = type === "up" ? "down" : "up";
    percent = percent * 3;
    const tpPercent = percent * RR;
    const slPercent = percent;

    const ratePriceTP =
      typeOrder === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
    const ratePriceSL =
      typeOrder === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

    const newOrder = {
      symbol,
      entry: +price,
      tp: ratePriceTP * +price,
      sl: ratePriceSL * +price,
      type: typeOrder,
      isCheckMinMax: true,
      timeStamp,
      percent,
      cost: (REWARD * 0.1) / percent,
    };
    dataForeCast.orderInfo = newOrder;
    dataForeCast.orderSimilar = null;
    dataForeCast.countSimilar = 0;
    dataForeCast.countOrders += 1;
    if (typeOrder === "up") {
      dataForeCast.countLong += 1;
    } else {
      dataForeCast.countShort += 1;
    }
  };

  const resetOrderSimilar = (dataForeCast) => {
    dataForeCast.countSimilar = 0;
    dataForeCast.orderSimilar = null;
  };

  ///////////
  if (dataForeCast.orderSimilar) {
    let { sl, tp, type, timeStamp, percent, cost } = dataForeCast.orderSimilar;
    const maxPrice = currentCandle[2];
    const minPrice = currentCandle[3];

    if (
      (type === "up" && minPrice <= sl) ||
      (type === "down" && maxPrice >= sl)
    ) {
      if (dataForeCast.countSimilar <= 25) {
        // việc hit SL quá nhanh trong thời gian ngăn là dấu hiệu của sự đảo chiều nên ngăn chặn việc order lệnh này
        resetOrderSimilar(dataForeCast);
      } else {
        updateOrder(dataForeCast, currentCandle);
      }
    } else if (dataForeCast.countSimilar < 125) {
      dataForeCast.countSimilar += 1;
    } else {
      resetOrderSimilar(dataForeCast);
    }
  } else if (dataForeCast.orderInfo) {
    const { sl, tp, type, timeStamp, percent, cost } = dataForeCast.orderInfo;
    const maxPrice = currentCandle[2];
    const minPrice = currentCandle[3];

    if (type === "up" && minPrice <= sl) {
      dataForeCast.loseOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.info.push(
        `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - LONG\n`
      );
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
    } else if (type === "down" && maxPrice >= sl) {
      dataForeCast.loseOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.info.push(
        `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - SHORT\n`
      );
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
    } else if (type === "up" && maxPrice >= tp) {
      dataForeCast.winOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
      // dataForeCast.info.push(
      //   `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(symbol)}\n`
      // );
    } else if (type === "down" && minPrice <= tp) {
      dataForeCast.winOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
      // dataForeCast.info.push(
      //   `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(symbol)}\n`
      // );
    }
  } else {
    listCandleInfo.pop();
    // listCandleInfo.reverse();

    const {
      isAbleOrder,
      type,
      tpPercent = 1,
      slPercent = 1,
      timeStamp = "",
    } = methodFn(listCandleInfo, symbol) || {};
    const rate = 1.5;
    // console.log(isAbleOrder);
    let typeOrder = type;
    if (isAbleOrder && (type === "up" || type === "down")) {
      const price = currentCandle[1];
      const ratePriceTP =
        typeOrder === "up" ? 1 + (tpPercent * rate) / 100 : 1 - (tpPercent * rate) / 100;
      const ratePriceSL =
        typeOrder === "up" ? 1 - (slPercent * rate) / 100 : 1 + (slPercent * rate) / 100;
      const newOrder = {
        symbol,
        entry: +price,
        tp: ratePriceTP * price,
        sl: ratePriceSL * price,
        type: typeOrder,
        isCheckMinMax: true,
        timeStamp,
        percent: slPercent,
        cost: (REWARD * 0.1) / slPercent,
      };
      dataForeCast.orderSimilar = newOrder;
      // dataForeCast.orderInfo = newOrder;
      // dataForeCast.countOrders += 1;
      // if (type === "up") {
      //   dataForeCast.countLong += 1;
      // } else {
      //   dataForeCast.countShort += 1;
      // }
    }
  }
};

const handleOtherMethod = (
  listCandleInfo,
  currentCandle,
  dataForeCast,
  methodFn,
  symbol
) => {
  if (dataForeCast.orderInfo) {
    const { sl, tp, type, timeStamp, percent, cost } = dataForeCast.orderInfo;
    const maxPrice = currentCandle[2];
    const minPrice = currentCandle[3];

    if (type === "up" && minPrice <= sl) {
      dataForeCast.loseOrder += 1;
      dataForeCast.orderInfo = null;
      // dataForeCast.info.push(
      //   `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(symbol)} - LONG\n`
      // );
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
      dataForeCast.profit =
        dataForeCast.profit -
        cost -
        REWARD * Math.pow(2, dataForeCast.levelPow);
      dataForeCast.levelPow += 1;
    } else if (type === "down" && maxPrice >= sl) {
      dataForeCast.loseOrder += 1;
      dataForeCast.orderInfo = null;
      // dataForeCast.info.push(
      //   `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(symbol)} - SHORT\n`
      // );
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.cost += cost;
      dataForeCast.profit =
        dataForeCast.profit -
        cost -
        REWARD * Math.pow(2, dataForeCast.levelPow);
      dataForeCast.levelPow += 1;
    } else if (type === "up" && maxPrice >= tp) {
      dataForeCast.winOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.profit =
        dataForeCast.profit -
        cost +
        REWARD * RR * Math.pow(2, dataForeCast.levelPow);
      dataForeCast.cost += cost;
      dataForeCast.levelPow = 0;
      dataForeCast.info.push(
        `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol,
          timeStamp
        )} - LONG\n`
      );
    } else if (type === "down" && minPrice <= tp) {
      dataForeCast.winOrder += 1;
      dataForeCast.orderInfo = null;
      dataForeCast.percent += percent;
      dataForeCast.count += 1;
      dataForeCast.profit =
        dataForeCast.profit -
        cost +
        REWARD * RR * Math.pow(2, dataForeCast.levelPow);
      dataForeCast.cost += cost;
      dataForeCast.levelPow = 0;
      dataForeCast.info.push(
        `${buildTimeStampToDate(timeStamp)} - ${buildLinkToSymbol(
          symbol
        )} - SHORT\n`
      );
    }
  } else {
    listCandleInfo.pop();
    // listCandleInfo.reverse();

    const {
      isAbleOrder,
      type,
      tpPercent = 1,
      slPercent = 1,
      timeStamp = "",
    } = methodFn(listCandleInfo, symbol) || {};
    // console.log(isAbleOrder);
    let typeOrder = type;
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
        isCheckMinMax: true,
        timeStamp,
        percent: slPercent,
        cost: (REWARD * 0.1 * Math.pow(2, dataForeCast.levelPow)) / slPercent,
      };
      dataForeCast.orderInfo = newOrder;
      dataForeCast.countOrders += 1;
      if (type === "up") {
        dataForeCast.countLong += 1;
      } else {
        dataForeCast.countShort += 1;
      }
    }
  }
};

export const getMinOnListCandle = (listCandle, type = 1) => {
  // type: 1 - OPEN    2 - HIGH    3 - LOW    4 - CLOSE
  const min = Math.min(...listCandle.map((candle) => +candle[type]));
  return +min;
};

export const getMaxOnListCandle = (listCandle, type = 1) => {
  // type:1 - OPEN    2 - HIGH    3 - LOW    4 - CLOSE
  const max = Math.max(...listCandle.map((candle) => +candle[type]));
  return +max;
};

export const getMinMaxAndIndexOnListCandle = (
  listCandle,
  key = "", // min --- max
  type = 1 // 1 - open, 2 - max, 3 - lowest, 4- close
) => {
  const value = Math[key](...listCandle.map((candle) => +candle[type]));

  const indexOfValue = listCandle.findIndex(
    (candle) => +candle[type] === +value
  );

  return { index: indexOfValue, value };
};

export const checkCurrentTrending = (candleStickData, type) => {
  let result = false;
  if (candleStickData.length > 50) {
    const length = candleStickData.length;
    const firstCandle = candleStickData[0];
    const centerCandle = candleStickData[50];
    const lastCandle = candleStickData[length - 1];

    if (type === "up") {
      result =
        (firstCandle[4] < centerCandle[4] && centerCandle[4] < lastCandle[4]) ||
        (firstCandle[4] > centerCandle[4] && lastCandle[4] > firstCandle[4]);
      // ||
      // (firstCandle[4] > centerCandle[4] && lastCandle[4] > centerCandle[4]);
    } else if (type === "down") {
      result =
        (firstCandle[4] > centerCandle[4] && centerCandle[4] > lastCandle[4]) ||
        (firstCandle[4] < centerCandle[4] && lastCandle[4] < firstCandle[4]) ||
        false;
    }
  }

  return result;
};

export const reverseCandleData = (candleStickData) => {
  const newData = [];
  const listCandles = [...candleStickData].reverse();
  listCandles.forEach((candle) => {
    const newInfoCandle = [...candle];
    newInfoCandle[1] = candle[4];
    // newInfoCandle[2] = candle[3];
    // newInfoCandle[3] = candle[2];
    newInfoCandle[4] = candle[1];
    newData.push(newInfoCandle);
  });

  return newData;
};

export const forecastTrending = (candleStickData) => {
  let type = "balance";

  const numberCandle = candleStickData.length;

  const firstMinRange = getMaxOnListCandle(
    candleStickData.slice(0, Math.ceil((numberCandle * 1) / 3)),
    3
  );

  const centerMinRange = getMaxOnListCandle(
    candleStickData.slice(34, Math.ceil((numberCandle * 2) / 3)),
    3
  );

  const lastMinRange = getMaxOnListCandle(
    candleStickData.slice(67, Math.ceil((numberCandle * 3) / 3)),
    3
  );

  if (firstMinRange < centerMinRange && firstMinRange < lastMinRange) {
    type = "go-up";
  } else if (firstMinRange > centerMinRange && firstMinRange > lastMinRange) {
    type = "go-down";
  }

  return type;
};

export const findContinueSameTypeCandle = (candleStickData) => {
  // đếm số nến cùng loại liên tiếp nhau nhiều nhất
  let listCountDown = [];
  let listCountUp = [];
  let countUp = 0;
  let countDown = 0;

  candleStickData.forEach((candle) => {
    if (
      isDownCandle(candle) ||
      (isUpCandle(candle) && candle[4] / candle[1] < 1.003)
    ) {
      countDown += 1;
      listCountUp.push(countUp);
      countUp = 0;
    } else if (
      isUpCandle(candle) ||
      (isDownCandle(candle) && candle[1] / candle[4] < 1.003)
    ) {
      countUp += 1;
      listCountDown.push(countDown);
      countDown = 0;
    }
  });

  const maxContinueUp = Math.max(...listCountUp);
  const maxContinueDown = Math.max(...listCountDown);

  return { maxContinueUp, maxContinueDown };
};

export const shuffleArr = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const getAlertByType = (type) => {
  return `${type === "up" ? "🟢🟢🟢🟢" : "🔴🔴🔴🔴"}\n`;
};

// lấy danh sách các đỉnh
export const getListHighest = (candleStickData = [], range = 10) => {
  const result = [];

  const { CLOSE } = TYPE_OF_PRICE;
  candleStickData.forEach((candle, index) => {
    if (index >= range - 1 && index <= candleStickData.length - range) {
      const maxBefore = getMaxOnListCandle(
        candleStickData.slice(index - range + 1, index + 1),
        CLOSE
      );
      const maxAfter = getMaxOnListCandle(
        candleStickData.slice(index, index + range),
        CLOSE
      );

      if (+candle[4] === maxBefore && +candle[4] === maxAfter) {
        const peakInfo = {
          price: candle[4],
          index,
        };

        result.push(peakInfo);
      }
    }
  });
  return result;
};

// lấy danh sách các đáy
export const getListLowest = (candleStickData = [], range = 10) => {
  const result = [];

  const { CLOSE } = TYPE_OF_PRICE;
  candleStickData.forEach((candle, index) => {
    if (index >= range - 1 && index <= candleStickData.length - range) {
      const minBefore = getMinOnListCandle(
        candleStickData.slice(index - range + 1, index + 1),
        CLOSE
      );
      const minAfter = getMinOnListCandle(
        candleStickData.slice(index, index + range),
        CLOSE
      );

      if (+candle[4] === minBefore && +candle[4] === minAfter) {
        const peakInfo = {
          price: +candle[4],
          index,
        };

        result.push(peakInfo);
      }
    }
  });
  return result;
};

export const isUpTrending = (arrPeak = [], allowViolation = 2) => {
  let violations = 0;
  for (let i = 1; i < arrPeak.length; i++) {
    if (arrPeak[i] < arrPeak[i - 1]) {
      violations++;
      if (violations > allowViolation) {
        return false;
      }
    }
  }
  if (arrPeak.slice(-3).length === 3) {
    // lấy 3 đỉnh gần đây nhất, nếu nó giảm dần thì khả năng đã chuyển sang xu hướng giảm
    const [peak1, peak2, peak3] = arrPeak.slice(-3);

    if (peak1 * 1.005 >= peak2 && peak2 >= peak3) {
      return false;
    }
  }
  return true;
};

export const isDownTrending = (arrPeak = [], allowViolation = 2) => {
  let violations = 0;
  for (let i = 1; i < arrPeak.length; i++) {
    if (arrPeak[i] > arrPeak[i - 1]) {
      violations++;
      if (violations > allowViolation) {
        return false;
      }
    }
  }
  if (arrPeak.slice(-3).length === 3) {
    // lấy 3 đỉnh gần đây nhất, nếu nó giảm dần thì khả năng đã chuyển sang xu hướng giảm
    const [peak1, peak2, peak3] = arrPeak.slice(-3);

    if (peak1 < peak2 && peak2 < peak3 * 1.005) {
      return false;
    }
  }
  return true;
};

// example
// 2 2 1 2 3 4 5 4 3 2  1  0  0
// 0 1 2 3 4 5 6 7 8 9 10 11 12
