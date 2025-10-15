import { BackTestFunction } from "./backtest/backtest.function.js";
import { ExecuteFn } from "./handlers/index.js";

export const getMaxWinRateByType = async (type, listCandleRes) => {
  const results = await Promise.all(
    Object.keys(ExecuteFn[type]).map(async (key) => {
      const backTestFn = ExecuteFn[type][key];
      const backTestKey = `${type}-${key}`;

      return await BackTestFunction({
        backTestInfo: {
          backTestFn,
          isUseBackTestInfo: true,
          dataCandleInfo: listCandleRes,
          backTestKey,
        },
      });
    })
  );

  const winRateInfo = results.reduce((acc, winInfo) => {
    const key = winInfo.backTestKey.split("-")[1];
    acc[key] = winInfo.winRate.toFixed(2);
    return acc;
  }, {});

  return {
    ...results.reduce((acc, res) => (res.winRate > acc.winRate ? res : acc), {
      winRate: 0,
      backTestKey: "",
    }),
    winRateInfo,
  };
};

export const getMinWinRateByType = async (type, listCandleRes) => {
  const results = await Promise.all(
    Object.keys(ExecuteFn[type]).map(async (key) => {
      const backTestFn = ExecuteFn[type][key];
      const backTestKey = `${type}-${key}`;

      return await BackTestFunction({
        backTestInfo: {
          backTestFn,
          isUseBackTestInfo: true,
          dataCandleInfo: listCandleRes,
          backTestKey,
        },
      });
    })
  );

  const winRateInfo = results.reduce((acc, winInfo) => {
    const key = winInfo.backTestKey.split("-")[1];
    acc[key] = winInfo.winRate.toFixed(2);
    return acc;
  }, {});

  return {
    ...results.reduce(
      (acc, res) =>
        !acc.winRate ? res : res.winRate < acc.winRate ? res : acc,
      {
        winRate: 0,
        backTestKey: "",
      }
    ),
    winRateInfo,
  };
};
