import {
  fetchApiGetAllCurrentPrice,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../../utils.js";
import { validatePriceForTrade } from "../../../../utils/handleDataCandle.js";
import { ForeCastFunction } from "../forecast/forecast.function.js";
import { ExecuteFn } from "../handlers/index.js";

const SETTING_BACKTEST = {
  listCandleParamTesting: {
    limit: 488,
    isUseRange: false,
    range: [0, 388],
  },
  loopData: false,
  excludeTimeStamp: [],
  // rangeTime: 1765990800000, //18/12
  // rangeTime: 1767200400000, //01/01
  // rangeTime: 1768496400000, //16/01
  // rangeTime: 1769878800000, //01/02
  // rangeTime: 1770829200000, //12/02
  // rangeTime:  1738342800000, //01/02 đáasldkaas
  isShowSL: false,
  isSpecificTime: true,
  typeFn: "SHORT",
  keyFn: "pattern_S4",
};

const {
  listCandleParamTesting: { limit, isUseRange, range },
  REWARD,
  RR,
  isSpecificTime,
  isShowSL,
  rangeTime,
  excludeTimeStamp,
  loopData,
  typeFn,
  keyFn,
} = SETTING_BACKTEST;

export const BackTestFunction = async (payload) => {
  try {
    const {
      bot,
      chatId,
      timeLine,
      typeCheck = "",
      isCheckWinRate = false,
      rangeTimePayload,
      CURRENT_LOOP_PAYLOAD,
      backTestInfo = {},
    } = payload;

    const {
      backTestFn,
      isUseBackTestInfo = false,
      dataCandleInfo,
      backTestKey,
    } = backTestInfo;

    let dataCandle;
    const methodFn = backTestFn || ExecuteFn[typeFn][keyFn];

    const listSymbolPriceCurrent = isUseBackTestInfo
      ? []
      : await fetchApiGetAllCurrentPrice();

    // const listSymbols = await fetchApiGetListingSymbols();

    let CURRENT_LOOP = CURRENT_LOOP_PAYLOAD || 0;

    let R = 0;
    let totalOrder = 0;
    let totalWin = 0;
    let totalLose = 0;
    let listInfoSL = [];
    let listInfoTP = [];
    let totalProfit = 0;
    let totalLong = 0;
    let totalShort = 0;
    let totalHasProfitRunning = 0;
    let newestRangeTime = null;
    const listOrderRunning = [];

    const handleDataCandleInfo = (candleInfo) => {
      const { symbol: symbolCandle, data: candleStickData } = candleInfo;
      if (symbolCandle === "BTCUSDT") {
        newestRangeTime = candleStickData.slice(-1)[0][0];
      }

      if (
        candleStickData &&
        candleStickData.length &&
        // candleStickData.length === limit &&
        validatePriceForTrade(+candleStickData.slice(-1)[0][4])
      ) {
        const payload = {
          candleStickData: isUseRange
            ? candleStickData.slice(range[0], range[1])
            : candleStickData,
          method: {
            methodFn,
            config: {
              rangeCandleInfo: 201,
              symbol: symbolCandle,
            },
          },
          typeCheck,
        };

        const {
          countOrders,
          countTP,
          countSL,
          profit,
          infoSL,
          infoTP,
          longOrders,
          shortOrders,
          orderInfo,
        } = ForeCastFunction(payload);

        totalWin += countTP;
        totalLose += countSL;
        totalOrder += countOrders;
        totalProfit += profit;
        totalLong += longOrders;
        totalShort += shortOrders;

        if (orderInfo) {
          const { tp, entry, type } = orderInfo;
          const currentPrice = +candleStickData.slice(-1)[0][4];
          const avgPrice = (Number(entry) + Number(tp)) / 2;

          if (type === "up" && currentPrice > +entry) {
            totalHasProfitRunning += 1;
          }
          if (type === "down" && currentPrice < +entry) {
            totalHasProfitRunning += 1;
          }
        }

        if (infoSL && infoSL.length) {
          listInfoSL.push(...infoSL);
        }

        if (infoTP && infoTP.length) {
          listInfoTP.push(...infoTP);
        }
      }
    };

    if (isUseBackTestInfo) {
      dataCandleInfo.forEach((candleInfo) => {
        handleDataCandleInfo(candleInfo);
      });

      const winRate = (totalWin * 100) / (totalWin + totalLose || 1);

      return {
        winRate,
        backTestKey,
      };
    } else if (listSymbolPriceCurrent && listSymbolPriceCurrent.length) {
      const promiseCandleData = listSymbolPriceCurrent
        .filter(
          (each) =>
            ![
              "BARDUSDT",
              "BTCSTUSDT",
              //   "BANANAS31USDT",
              //   "SIRENUSDT",
              //   "BROCCOLI714USDT",
              //   "BROCCOLIF3BUSDT",
              //   "TUTUSDT",
              //   "PLUMEUSDT",
              //   "BIDUSDT",
              //   "BRUSDT",
              //   "MUBARAKUSDT",
              //   "BMTUSDT",
              //   "FORMUSDT",
              //   "JELLYJELLYUSDT",
            ].includes(each.symbol) &&
            each.symbol.endsWith("USDT") &&
            parseFloat(each.price) < 1,
        )
        .map(async (token) => {
          const { symbol, stickPrice } = token;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: limit, // 388 -- 676 -- 964
            },
          };

          if (rangeTime || rangeTimePayload) {
            params.data.startTime = rangeTimePayload || rangeTime;
          }
          const res = await fetchApiGetCandleStickData(params);
          return res;
        });

      Promise.all(promiseCandleData.filter(Boolean)).then(async (res) => {
        if (res.length) {
          res.filter(Boolean).forEach((candleInfo, index) => {
            handleDataCandleInfo(candleInfo);
          });

          const mapInfoSameTimeStampSL = {};
          listInfoSL.forEach((info) => {
            const timeStamp = info.split("-")[0];
            if (typeof mapInfoSameTimeStampSL[timeStamp] === "object") {
              mapInfoSameTimeStampSL[timeStamp].push(info);
            } else if (!mapInfoSameTimeStampSL[timeStamp]) {
              mapInfoSameTimeStampSL[timeStamp] = [info];
            }
          });

          const mapInfoSameTimeStampTP = {};
          listInfoTP.forEach((info) => {
            const timeStamp = info.split("-")[0];
            if (typeof mapInfoSameTimeStampTP[timeStamp] === "object") {
              mapInfoSameTimeStampTP[timeStamp].push(info);
            } else if (!mapInfoSameTimeStampTP[timeStamp]) {
              mapInfoSameTimeStampTP[timeStamp] = [info];
            }
          });

          const useMapInfo = isShowSL
            ? mapInfoSameTimeStampSL
            : mapInfoSameTimeStampTP;

          const findListSameTimeStampHighest = Object.keys(useMapInfo).reduce(
            (acc, key) => {
              if (
                !excludeTimeStamp.includes(key) &&
                acc.length < useMapInfo[key].length
              ) {
                return useMapInfo[key];
              }

              return acc;
            },
            [],
          );

          const findListSpecificTimeOrder = Object.keys(useMapInfo).reduce(
            (acc, key) => {
              if (
                !excludeTimeStamp.includes(key) &&
                useMapInfo[key] &&
                useMapInfo[key].length
              ) {
                acc.push(useMapInfo[key][0]);
              }

              return acc;
            },
            [],
          );

          const findListSpecificTimeOrderTP = Object.keys(
            mapInfoSameTimeStampTP,
          ).reduce((acc, key) => {
            if (
              !excludeTimeStamp.includes(key) &&
              mapInfoSameTimeStampTP[key] &&
              mapInfoSameTimeStampTP[key].length
            ) {
              acc.push(mapInfoSameTimeStampTP[key][0]);
            }

            return acc;
          }, []);

          const findListSpecificTimeOrderSL = Object.keys(
            mapInfoSameTimeStampSL,
          ).reduce((acc, key) => {
            if (
              !excludeTimeStamp.includes(key) &&
              mapInfoSameTimeStampSL[key] &&
              mapInfoSameTimeStampSL[key].length
            ) {
              acc.push(mapInfoSameTimeStampSL[key][0]);
            }

            return acc;
          }, []);

          const listTimeOrderWillShow = isSpecificTime
            ? findListSpecificTimeOrder
            : findListSameTimeStampHighest;

          if (true && !isCheckWinRate && !loopData) {
            // Dùng cho việc log ra các lệnh SL\TP, cho việc đánh giá lý do tại sao lệnh chạm SL
            let tempMess = [];
            for (let i = 0; i < listTimeOrderWillShow.length; i++) {
              if (i > 20) break;
              if (i % 5 === 0 && i !== 0) {
                tempMess.push(listTimeOrderWillShow[i]);
                bot.sendMessage(chatId, `${tempMess.join("")}`, {
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                });
                tempMess = [];
              } else {
                tempMess.push(listTimeOrderWillShow[i]);
              }
            }
            if (tempMess.length) {
              bot.sendMessage(chatId, `${tempMess.join("")}`, {
                parse_mode: "HTML",
                disable_web_page_preview: true,
              });
              tempMess = [];
            }
          }

          bot
            .sendMessage(
              chatId,
              `${
                typeCheck
                  ? typeCheck === 1
                    ? "🟢🟢🟢🟢"
                    : "🔴🔴🔴🔴"
                  : isCheckWinRate
                    ? "🟢🟢🔴🔴"
                    : ""
              }\n+ Profit: ${(+totalProfit).toFixed(
                2,
              )}\n+ Win: ${totalWin} \n+ Lose: ${totalLose}\n+ Total: ${totalOrder} -- ${totalLong} LONG - ${totalShort} SHORT\n+Win Rate: ${
                (totalWin * 100) / (totalWin + totalLose)
              }% \n ${listTimeOrderWillShow.length}\n------------------\n+ TP: ${
                Object.keys(mapInfoSameTimeStampTP).length
              } \n+ SL: ${Object.keys(mapInfoSameTimeStampSL).length}\n------------------\n 🟢${findListSpecificTimeOrderTP.length} -- 🔴${findListSpecificTimeOrderSL.length} \n - Profit running: ${totalHasProfitRunning} / ${
                totalOrder - totalWin - totalLose
              }\n${+totalProfit > 0 ? "🟢🟢🟢🟢" : "🔴🔴🔴🔴"}`,
              {
                parse_mode: "HTML",
                disable_web_page_preview: true,
              },
            )
            .then((sentMess) => {
              if (loopData && CURRENT_LOOP <= loopData && newestRangeTime) {
                bot.sendMessage(chatId, "-----🎯🎯🎯🎯🎯🎯🎯------");
                BackTestFunction({
                  ...payload,
                  rangeTimePayload: newestRangeTime,
                  CURRENT_LOOP_PAYLOAD: CURRENT_LOOP + 1,
                });
              }
            });
        }
      });
    }
  } catch (error) {
    console.error("Error in TestingFunction:", error);
  }
};
