import {
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { shuffleArr, validatePriceForTrade } from "../../../utils/handleDataCandle.js";
import { CONFIG_QUICK_TRADE } from "./config.js";
import { ForeCastMethodFOMO } from "./forecast.js";
import { checkAbleQuickOrder1M } from "./utils.1m.js";
import { checkAbleQuickOrder } from "./utils.js";

const {
  listCandleParamTesting: { limit, isUseRange, range },
  REWARD,
  RR,
} = CONFIG_QUICK_TRADE;

export const BackTestFOMO = async (payload) => {
  try {
    const { bot, chatId, timeLine } = payload;

    let dataCandle;
    const methodFn = timeLine === '1m' ? checkAbleQuickOrder1M : checkAbleQuickOrder;

    const listSymbols = await fetchApiGetListingSymbols();

    let R = 0;
    let totalOrder = 0;
    let totalWin = 0;
    let totalLose = 0;
    let listInfo = [];
    let totalProfit = 0;
    let totalLong = 0;
    let totalShort = 0;

    const listOrderRunning = [];

    if (listSymbols && listSymbols.length) {
      const promiseCandleData = listSymbols
        .filter((each) => !["RSRUSDT", "BTCSTUSDT"].includes(each.symbol))
        .map(async (token) => {
          const { symbol, stickPrice } = token;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: limit, // 388 -- 676 -- 964
              startTime: 1741305601000,
              // startTime: 1739735100000,
            },
          };
          const res = await fetchApiGetCandleStickData(params);
          return res;
        });

      Promise.all(promiseCandleData.filter(Boolean)).then(async (res) => {
        if (res.length) {
          shuffleArr(res)
            .filter(Boolean)
            .forEach((candleInfo, index) => {
              const { symbol: symbolCandle, data: candleStickData } =
                candleInfo;

              if (
                candleStickData &&
                candleStickData.length &&
                (false || candleStickData.slice(-1)[0][4] < 5) &&
                validatePriceForTrade(candleStickData.slice(-1)[0][4])
              ) {
                const payload = {
                  candleStickData: isUseRange
                    ? candleStickData.slice(range[0], range[1])
                    : candleStickData,
                  method: {
                    methodFn,
                    config: {
                      rangeCandleInfo: 150,
                      symbol: symbolCandle,
                    },
                  },
                };

                const {
                  countOrders,
                  countTP,
                  countSL,
                  profit,
                  info,
                  longOrders,
                  shortOrders,
                } = ForeCastMethodFOMO(payload);

                totalWin += countTP;
                totalLose += countSL;
                totalOrder += countOrders;
                totalProfit += profit;
                totalLong += longOrders;
                totalShort += shortOrders;

                if (info && info.length) {
                  listInfo.push(...info);
                }
              }
            });

            const mapInfoSameTimeStamp = {};
            listInfo.forEach((info) => {
              const timeStamp = info.split("-")[0];
              if (typeof mapInfoSameTimeStamp[timeStamp] === "object") {
                mapInfoSameTimeStamp[timeStamp].push(info);
              } else if (!mapInfoSameTimeStamp[timeStamp]) {
                mapInfoSameTimeStamp[timeStamp] = [info];
              }
            });

            const findListSameTimeStampHighest = Object.keys(
              mapInfoSameTimeStamp
            ).reduce((acc, key) => {
              if (acc.length < mapInfoSameTimeStamp[key].length) {
                return mapInfoSameTimeStamp[key];
              }

              return acc;
            }, []);
          if (true) {
            // Dùng cho việc log ra các lệnh SL\TP, cho việc đánh giá lý do tại sao lệnh chạm SL
            let tempMess = [];
            for (let i = 0; i < findListSameTimeStampHighest.length; i++) {
              if (i > 20) break;
              if (i % 5 === 0 && i !== 0) {
                tempMess.push(findListSameTimeStampHighest[i]);
                bot.sendMessage(chatId, `${tempMess.join("")}`, {
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                });
                tempMess = [];
              } else {
                tempMess.push(findListSameTimeStampHighest[i]);
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

          bot.sendMessage(
            chatId,
            `+ Profit: ${(+totalProfit).toFixed(
              2
            )}\n+ Win: ${totalWin} \n+ Lose: ${totalLose}\n+ Total: ${totalOrder} - ${totalLong} LONG - ${totalShort} SHORT \n ${findListSameTimeStampHighest.length}`
          );
        }
      });
    }
  } catch (error) {
    console.error("Error in TestingFunction:", error);
  }
};
