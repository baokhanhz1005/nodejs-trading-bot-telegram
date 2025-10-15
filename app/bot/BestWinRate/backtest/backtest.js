import {
  buildTimeStampToDate,
  fetchAllCandles,
  fetchApiGetAllCurrentPrice,
  fetchApiGetCandleStickData,
} from "../../../../utils.js";
import { ExecuteFn } from "../handlers/index.js";
import { getMaxWinRateByType, getMinWinRateByType } from "../utils.js";
import { BackTestFunction } from "./backtest.function.js";

const SETTING_BACKTEST = {
  listCandleParamTesting: {
    limit: 488,
    isUseRange: false,
    range: [0, 345],
  },
  loopData: false,
  excludeTimeStamp: [],
  // rangeTime: 1757597100000, // ngày 12
  // rangeTime: 1756756860000, // thang 9
  rangeTime: 1754121600000,
};

const COST = 1;
const RR = 1;

const {
  listCandleParamTesting: { limit, isUseRange, range },
  rangeTime,
} = SETTING_BACKTEST;

export const BackTestBestFunction = async (payload) => {
  const {
    bot,
    chatId,
    timeLine,
    typeCheck = "",
    isCheckWinRate = false,
    rangeTimePayload,
    CURRENT_LOOP_PAYLOAD,
    nextData = {},
  } = payload;

  let totalOrder = nextData.totalOrder || 0,
    totalWin = nextData.totalWin || 0,
    totalLose = nextData.totalLose || 0,
    totalProfit = nextData.totalProfit || 0,
    totalLong = nextData.totalLong || 0,
    totalShort = nextData.totalShort || 0,
    newestRangeTime = null,
    numInitCandle = 200,
    numCandleWinRate = 100,
    limit = 500,
    nextTimeStamp = nextData.nextTimeStamp || "",
    currentTimeStamp = "",
    maxLost = nextData.maxLost || 0,
    maxProfit = nextData.maxProfit || 0,
    currentBestKey = nextData.currentBestKey || "",
    currentBestWinRate = nextData.currentBestWinRate || 0,
    isHasOrder = nextData.isHasOrder || false;

  const orderInfo = nextData.orderInfo || {};

  const listSymbolPriceCurrent = await fetchApiGetAllCurrentPrice();

  if (listSymbolPriceCurrent && listSymbolPriceCurrent.length) {
    const promiseCandleData = listSymbolPriceCurrent
      .filter(
        (each) =>
          !["BARDUSDT", "BTCSTUSDT"].includes(each.symbol) &&
          each.symbol.endsWith("USDT") &&
          parseFloat(each.price) < 1
      )
      .map(async (token) => {
        const { symbol, stickPrice } = token;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit,
          },
        };

        if (nextTimeStamp || rangeTime) {
          params.data.startTime = nextTimeStamp || rangeTime;
        }
        const res = await fetchApiGetCandleStickData(params);
        // const res = await fetchAllCandles(symbol, timeLine, 100, nextTimeStamp || rangeTime);
        return res;
      });

    const res = await Promise.all(promiseCandleData.filter(Boolean));
    if (res.length) {
      const listSymbolHasData = res.filter(
        (candle) => candle.data.length && candle.data.length === limit
      );
      const rangeCandle = numInitCandle + numCandleWinRate;
      const listTimeStamps = listSymbolHasData
        .map((symbolInfo) => {
          const { data = [] } = symbolInfo;
          const nextIndx = (data.length || limit) - rangeCandle;

          return +data[nextIndx][0];
        })
        .filter(Boolean);

      const most = listTimeStamps.reduce(
        (acc, n) => ((acc[n] = (acc[n] || 0) + 1), acc),
        {}
      );

      nextTimeStamp = Object.entries(most).sort((a, b) => b[1] - a[1])[0][0];

      const timeDate = new Date(nextTimeStamp);

      const date = timeDate.getDate();
      const hour = timeDate.getHours();
      if (date === 28 && hour > 12) {
        return;
      }

      let index = 0;

      for (
        let i = 0 + rangeCandle;
        i < (listSymbolHasData[0]?.data?.length || limit);
        i++
      ) {
        const currentListCandleRes = listSymbolHasData
          .filter((candle) => candle.data.length)
          .map((each) => {
            return {
              ...each,
              data: each.data.slice(index, i),
            };
          });

        const isGetMax = false;
        let winRateInfo = {};
        let acc = { winRate: 0, backTestKey: "" };
        for (const key of ["LONG", "SHORT"]) {
          const handlerFn = isGetMax
            ? getMaxWinRateByType
            : getMinWinRateByType;
          const bestWinRateInfo = await handlerFn(key, currentListCandleRes);
          winRateInfo = {
            ...winRateInfo,
            ...bestWinRateInfo.winRateInfo,
          };
          if (
            isGetMax
              ? bestWinRateInfo.winRate > acc.winRate
              : bestWinRateInfo.winRate < acc.winRate || !acc.winRate
          ) {
            acc = bestWinRateInfo;
          }
        }

        const { winRate, backTestKey } = acc;

        if (currentBestKey !== backTestKey) {
          currentBestKey = backTestKey;
          isHasOrder = false;
          currentBestWinRate = winRate;
        } else if (winRate >= currentBestWinRate) {
          isHasOrder = true;
          currentBestWinRate = winRate;
        } else {
          isHasOrder = false;
          currentBestWinRate = winRate;
        }

        const [type, key] = backTestKey.split("-");

        const methodFn = ExecuteFn?.[type]?.[key] || (() => {});

        listSymbolHasData.forEach((candleInfo) => {
          const { symbol, data = [] } = candleInfo;

          const candleStickData = data.slice(i - 200, i);

          if (orderInfo[symbol]) {
            const {
              entry,
              tp,
              sl,
              type,
              timeStamp,
              percent,
              funding,
              methodRR,
              levelPow = 0,
            } = orderInfo[symbol] || {};

            const currentCandle = candleStickData.slice(-1)[0];

            const maxCurrentPrice = currentCandle[2];
            const minCurrentPrice = currentCandle[3];

            const currentRR = methodRR || RR;

            const profit = currentRR * COST * Math.pow(2, levelPow) - funding;
            const lost = -(COST * Math.pow(2, levelPow) + funding);

            if (type === "up" && minCurrentPrice <= sl) {
              totalLose += 1;
              totalProfit += lost;

              delete orderInfo[symbol];
            } else if (type === "down" && maxCurrentPrice >= sl) {
              totalLose += 1;
              totalProfit += lost;

              delete orderInfo[symbol];
            } else if (type === "up" && maxCurrentPrice >= tp) {
              totalWin += 1;
              totalProfit += profit;

              delete orderInfo[symbol];
            } else if (type === "down" && minCurrentPrice <= tp) {
              totalWin += 1;
              totalProfit += profit;

              delete orderInfo[symbol];
            }
          } else {
            let {
              type,
              symbol: symbolOrder,
              isAbleOrder = false,
              tpPercent,
              slPercent,
              entry,
              timeStamp,
              methodRR,
            } = methodFn(candleStickData, symbol) || {};

            if (
              isAbleOrder &&
              isHasOrder &&
              (type === "up" || type === "down")
            ) {
              const R = 1.5;
              methodRR = 1.5;
              type = type === "up" ? "down" : "up";

              const ratePriceTP =
                type === "up"
                  ? 1 + (tpPercent * R) / 100
                  : 1 - (tpPercent * R) / 100;
              const ratePriceSL =
                type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

              const newOrder = {
                symbol: symbolOrder,
                entry,
                tp: ratePriceTP * entry,
                sl: ratePriceSL * entry,
                type,
                timeStamp,
                percent: slPercent,
                funding: (COST * 0.1 * Math.pow(2, 0)) / slPercent,
                methodRR,
              };

              orderInfo[symbolOrder] = newOrder;
              totalOrder += 1;

              if (type === "up") {
                totalLong += 1;
              } else {
                totalShort += 1;
              }
            }
          }
        });

        // console.log("Next Timeeeeeeeeeeeeeeee   >>>>>>>>>", {
        //   i,
        //   time: buildTimeStampToDate(listSymbolHasData[0].data[i - 1][0]),
        //   backTestKey,
        //   winRate,
        //   totalOrder,
        //   totalLong,
        //   totalShort,
        //   totalWin,
        //   totalLose,
        //   totalProfit,
        //   rate: (totalWin * 100) / (totalWin + totalLose || 1),
        //   nextTimeStamp,
        // });
        const listKeyWinInfo = Object.keys(winRateInfo);

        maxLost = +totalProfit < maxLost ? +totalProfit : maxLost;
        maxProfit = +totalProfit > maxProfit ? +totalProfit : maxProfit;

        await bot.sendMessage(
          chatId,
          `🎯🎯🎯🎯🎯🎯🎯 \nTIME: ${buildTimeStampToDate(
            listSymbolHasData[0].data[i - 1][0]
          )}\n\n📌 ${i}\n💎 Profit: ${(+totalProfit).toFixed(
            2
          )}\n🚀 Total: ${totalOrder}\n🟣 Running: ${
            totalOrder - totalWin - totalLose
          } - ${totalLong} LONG - ${totalShort} SHORT\n🟢 Win: ${totalWin} \n🔴 Lose: ${totalLose}\n⭐ Rate: ${(
            (totalWin * 100) /
            (totalWin + totalLose || 1)
          ).toFixed(2)}%\n  ${
            isHasOrder ? "Processing..." : "Waiting"
          } (${currentBestWinRate.toFixed(
            2
          )})\n-------------------------------\n- MaxLoss: ${maxLost.toFixed(
            2
          )}   --  MaxProfit: ${maxProfit.toFixed(
            2
          )}\n${nextTimeStamp}\n${listKeyWinInfo
            .map((key, index) => {
              if (index < 6) {
                const otherKey = listKeyWinInfo[index + 6];
                const isBest = backTestKey.split("-")[1] === key;
                const isBestOther = backTestKey.split("-")[1] === otherKey;

                return ` ${key}: ${winRateInfo[key]} ${
                  isBest ? "🌟🌟--" : "----------"
                } ${otherKey}: ${winRateInfo[otherKey]} ${
                  isBestOther ? "🌟🌟" : ""
                }`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n")}
          `
        );

        index += 1;
      }
    }

    let timer = setTimeout(() => {
      BackTestBestFunction({
        bot,
        chatId,
        timeLine,
        nextData: {
          nextTimeStamp,
          totalOrder,
          totalLong,
          totalShort,
          totalWin,
          totalLose,
          totalProfit,
          orderInfo,
          maxLost,
          maxProfit,
          currentBestKey,
          currentBestWinRate,
          isHasOrder,
        },
      });

      clearTimeout(timer);
    }, 1000);
  }
};
