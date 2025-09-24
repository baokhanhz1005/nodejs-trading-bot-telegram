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

  return results.reduce((acc, res) => (res.winRate > acc.winRate ? res : acc), {
    winRate: 0,
    backTestKey: "",
  });
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

  return results.reduce(
    (acc, res) => (!acc.winRate ? res : res.winRate < acc.winRate ? res : acc),
    {
      winRate: 0,
      backTestKey: "",
    }
  );
};
