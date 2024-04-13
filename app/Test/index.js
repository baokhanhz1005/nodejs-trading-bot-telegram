import fs from "fs/promises";
import path from "path";
import { TEST_CONFIG } from "../../constant.js";
import {
  buildLinkToSymbol,
  calculateTimeout15m,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
  timeToSpecificTime,
} from "../../utils.js";
import util from "util";
import { checkSafetyPrice } from "../handlers/TrackingPriceSafety/utils.js";
import { checkHasBigPriceTrend } from "../handlers/TrackingBigPriceTrend/utils.js";
import {
  checkAvailableOrder,
  checkAvailableOrderV2,
} from "../execute/ExecuBuySellRestricted/utils.js";
import { checkAbleOrderSMC } from "../execute/ExecuteSMC/utils.js";
import { COST, REWARD, RR } from "../execute/ExecuteSMC/constant.js";
import { checkAbleOrderBySympleMethod } from "../execute/ExecuteSympleMethod/utils.js";

export const Test = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();

  // directory
  const fileName = "MOCK_DATA_TRADE.json";
  const filePath = path.join(".", fileName);
  let countTP = 0;
  let countSL = 0;
  let payloadAccount;

  let countRound = 0;
  let limitResetPow = 10;
  let balancePerRound = 0;
  let symbolWithCondition = [];
  try {
    payloadAccount = TEST_CONFIG;
    // const dataStoraged = await fs.readFile(filePath, "utf-8");
    // payloadAccount = JSON.parse(dataStoraged);
    // if (payloadAccount) {
    //   payloadAccount.orders = payloadAccount.orders.map((order) => {
    //     return {
    //       ...order,
    //       isCheckMinMax: true,
    //     };
    //   });
    // }
    console.log("Get from try");
  } catch (e) {
    console.log("Get from catch");
    payloadAccount = TEST_CONFIG;
  }

  const dataAccount = payloadAccount;

  const writeFile = util.promisify(fs.writeFile);
  process.on("SIGINT", async () => {
    console.log(
      "Caught interrupt signal (Ctrl+C). Writing to file before exiting..."
    );
    await writeToDisk();
    process.exit();
  });

  process.on("uncaughtException", async (error) => {
    console.error(
      "Uncaught exception. Writing to file before exiting...",
      error
    );
    await writeToDisk();
    process.exit(1);
  });

  const writeToDisk = async () => {
    try {
      await writeFile(filePath, JSON.stringify(dataAccount, null, 2));
      console.log("Write to file successful!");
    } catch (error) {
      console.error("Error writing to file:", error);
    }
  };

  bot.sendMessage(
    chatId,
    `Tài khoản hiện tại của bạn là ${dataAccount.account}$`
  );
  const handleData = async (listSymbols) => {
    const timeMinute = new Date().getMinutes();
    const isHasTrackingData = timeMinute % 5 === 0;

    if (!isHasTrackingData) {
      if (dataAccount.orders.length) {
        try {
          const listPromiseResult = [];
          for (const index in dataAccount.orders) {
            const order = dataAccount.orders[index];

            if (!order) continue;
            const {
              symbol,
              type,
              tp,
              sl,
              isCheckMinMax,
              startTime,
              percent,
              levelPow,
            } = order;
            const params = {
              data: {
                symbol: symbol,
                interval: timeLine,
                limit: 2,
              },
            };

            const res = await fetchApiGetCandleStickData(params);

            listPromiseResult.push(res);
          }

          // check is has TP / SL
          Promise.all(listPromiseResult).then((res) => {
            if (res.length) {
              res.forEach((candleInfo) => {
                const { data: candleStickData, symbol: symbolCandle } =
                  candleInfo;
                const order = dataAccount.orders.find(
                  (each) => each.symbol === symbolCandle
                );
                if (order) {
                  const {
                    symbol,
                    type,
                    tp,
                    sl,
                    isCheckMinMax,
                    startTime,
                    percent,
                    levelPow,
                  } = order;

                  if (candleStickData && candleStickData.length) {
                    const [candleCheck, lastestCandle] = candleStickData;

                    const maxPrice = lastestCandle[2];
                    const minPrice = lastestCandle[3];

                    if (type === "up" && minPrice <= sl) {
                      dataAccount.account =
                        dataAccount.account -
                        REWARD * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      dataAccount.orders = dataAccount.orders.filter(
                        (order) => order.symbol !== symbol
                      );
                      balancePerRound =
                        balancePerRound -
                        REWARD * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent; ////////
                      bot.sendMessage(
                        chatId,
                        `😭 SL lệnh ${
                          type === "up" ? "LONG" : "SHORT"
                        } ${buildLinkToSymbol(
                          symbol
                        )} tại giá ${sl} - ${symbol} - L${
                          dataAccount.mapLevelPow[symbol]
                        }\n-Balance: ${balancePerRound}`,
                        { parse_mode: "HTML", disable_web_page_preview: true }
                      );
                      countSL += 1;
                      if (dataAccount.mapLevelPow[symbol] === 8) {
                        dataAccount.mapLevelPow[symbol] = 0;
                        bot.sendMessage(
                          chatId,
                          `### ${symbol} dính lệnh lose liên tục`
                        );
                      } else {
                        dataAccount.mapLevelPow[symbol] += 1;
                      }
                    } else if (type === "down" && maxPrice >= sl) {
                      dataAccount.account =
                        dataAccount.account -
                        REWARD * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      dataAccount.orders = dataAccount.orders.filter(
                        (order) => order.symbol !== symbol
                      );
                      balancePerRound =
                        balancePerRound -
                        REWARD * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent; /////////
                      bot.sendMessage(
                        chatId,
                        `😭 SL lệnh ${
                          type === "up" ? "LONG" : "SHORT"
                        } ${buildLinkToSymbol(
                          symbol
                        )} tại giá ${sl} - ${symbol} - L${
                          dataAccount.mapLevelPow[symbol]
                        }\n-Balance: ${balancePerRound}`,
                        { parse_mode: "HTML", disable_web_page_preview: true }
                      );
                      if (dataAccount.mapLevelPow[symbol] === 8) {
                        dataAccount.mapLevelPow[symbol] = 0;
                        bot.sendMessage(
                          chatId,
                          `### ${symbol} dính lệnh lose liên tục`
                        );
                      } else {
                        dataAccount.mapLevelPow[symbol] += 1;
                      }
                      countSL += 1;
                    } else if (type === "up" && maxPrice >= tp) {
                      dataAccount.account =
                        dataAccount.account +
                        REWARD * RR * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      dataAccount.orders = dataAccount.orders.filter(
                        (order) => order.symbol !== symbol
                      );
                      balancePerRound =
                        balancePerRound +
                        REWARD * RR * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      bot.sendMessage(
                        chatId,
                        `😍 TP lệnh ${
                          type === "up" ? "LONG" : "SHORT"
                        } ${buildLinkToSymbol(
                          symbol
                        )} tại giá ${tp} - ${symbol} - L${
                          dataAccount.mapLevelPow[symbol]
                        }\n-Balance: ${balancePerRound}`,
                        { parse_mode: "HTML", disable_web_page_preview: true }
                      );
                      dataAccount.mapLevelPow[symbol] = 0;
                      countTP += 1;
                    } else if (type === "down" && minPrice <= tp) {
                      dataAccount.account =
                        dataAccount.account +
                        REWARD * RR * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      dataAccount.orders = dataAccount.orders.filter(
                        (order) => order.symbol !== symbol
                      );
                      balancePerRound =
                        balancePerRound +
                        REWARD * RR * Math.pow(2, levelPow) -
                        (REWARD * 0.1 * Math.pow(2, levelPow)) / percent;
                      bot.sendMessage(
                        chatId,
                        `😍 TP lệnh ${
                          type === "up" ? "LONG" : "SHORT"
                        } ${buildLinkToSymbol(
                          symbol
                        )} tại giá ${tp} - ${symbol} - L${
                          dataAccount.mapLevelPow[symbol]
                        }\n-Balance: ${balancePerRound}`,
                        { parse_mode: "HTML", disable_web_page_preview: true }
                      );
                      dataAccount.mapLevelPow[symbol] = 0;
                      countTP += 1;
                    }
                  }
                }
              });
            }
          });

          // reset levelPow when achieve limit reset
          if (false && balancePerRound > limitResetPow) {
            // reset data
            countSL = 0;
            countTP = 0;
            Object.keys(dataAccount.mapLevelPow).forEach((symb) => {
              dataAccount.mapLevelPow[symb] = 0;
            });
            balancePerRound = 0;
            countRound += 1;
            ////////////

            if (dataAccount.orders.length) {
              let accountTemp = 0;
              let countRemainOrder = 0;
              // console.log(dataAccount.orders);
              const listPromiseCandle = dataAccount.orders
                .map((order) => {
                  if (!order) return null;
                  const { symbol } = order || {};
                  const params = {
                    data: {
                      symbol: symbol,
                      interval: timeLine,
                      limit: 2,
                    },
                  };
                  return fetchApiGetCandleStickData(params);
                })
                .filter(Boolean);

              Promise.all(listPromiseCandle).then((res) => {
                if (res.length) {
                  res.forEach(async (each) => {
                    if (each) {
                      countRemainOrder += 1;
                      const { data: candleStickData, symbol: symbolCandle } =
                        each;
                      if (candleStickData && candleStickData.length) {
                        const [candleCheck, lastestCandle] = candleStickData;
                        const currentPrice = lastestCandle[4];
                        const order = dataAccount.orders.find(
                          (each) => each && each.symbol === symbolCandle
                        );
                        if (order) {
                          const { symbol, type, volume, entry } = order || {};

                          if (type === "up") {
                            if (+currentPrice > +entry) {
                              accountTemp +=
                                (+currentPrice / +entry - 1) * volume;
                            } else {
                              accountTemp -=
                                (1 - +currentPrice / +entry) * volume;
                            }
                          } else if (type === "down") {
                            if (+currentPrice > +entry) {
                              accountTemp -=
                                (+currentPrice / +entry - 1) * volume;
                            } else {
                              accountTemp +=
                                (1 - +currentPrice / +entry) * volume;
                            }
                          }
                        }
                      }
                    }
                  });
                }
              });

              dataAccount.account = dataAccount.account + accountTemp;
              dataAccount.orders = [];
              bot.sendMessage(
                chatId,
                `Đã thu hồi tất cả các lệnh - thu về: ${accountTemp}`
              );
            }
          }
        } catch (error) {
          console.error("Error handling data:", error);
        }
      }
    } else {
      if (listSymbols && listSymbols.length) {
        let listSymbolGetData = symbolWithCondition;
        if (!listSymbolGetData.length) {
          listSymbolGetData = listSymbols;
        }
        const listPromiseCandle = listSymbolGetData.map((token) => {
          const { symbol, stickPrice } = token;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: 100,
            },
          };

          return fetchApiGetCandleStickData(params);
        });

        Promise.all(listPromiseCandle).then((res) => {
          const temListSymbol = [];
          if (res.length) {
            res.forEach(async (candleInfo) => {
              const { symbol: symbolCandle, data: candleStickData } =
                candleInfo;

              if (
                candleStickData &&
                candleStickData.length &&
                candleStickData.slice(-1)[0][4] < 0.1
              ) {
                const symbolWithCondition = listSymbols.find(
                  (token) => token.symbol === symbolCandle
                );
                temListSymbol.push(symbolWithCondition);

                candleStickData.pop();
                // candleStickData.reverse();
                const { isAbleOrder, type, tpPercent, slPercent } =
                  checkAbleOrderBySympleMethod(candleStickData, symbolCandle);

                let typeOrder = type;
                if (
                  isAbleOrder &&
                  symbolCandle !== "RSRUSDT" &&
                  dataAccount.orders.every(
                    (order) => order.symbol !== symbolCandle
                  )
                ) {
                  const data = await fetchApiGetCurrentPrice({
                    symbol: symbolCandle,
                  });

                  const { price } = data;
                  let priceGap = 0;
                  const lastestCandle = [...candleStickData.slice(-1)];

                  if (typeOrder === "up") {
                    priceGap =
                      lastestCandle[4] < price ? price - lastestCandle[4] : 0;
                  } else if (typeOrder === "down") {
                    priceGap =
                      lastestCandle[4] > price ? lastestCandle[4] - price : 0;
                  }
                  const dataTime = new Date();
                  const ratePriceTP =
                    typeOrder === "up"
                      ? 1 + tpPercent / 100
                      : 1 - tpPercent / 100;
                  const ratePriceSL =
                    typeOrder === "up"
                      ? 1 - slPercent / 100
                      : 1 + slPercent / 100;
                  const newOrder = {
                    symbol: symbolCandle,
                    entry: +price,
                    tp:
                      ratePriceTP * price +
                      (typeOrder === "up" ? priceGap * RR : -priceGap * RR),
                    sl:
                      ratePriceSL * price +
                      (typeOrder === "up" ? -priceGap : priceGap),
                    type: typeOrder,
                    startTime: dataTime.getTime(),
                    isCheckMinMax: true,
                    percent: slPercent,
                    levelPow: dataAccount.mapLevelPow[symbolCandle] || 0,
                    volume:
                      (REWARD *
                        Math.pow(
                          2,
                          dataAccount.mapLevelPow[symbolCandle] || 0
                        ) *
                        100) /
                      slPercent,
                  };
                  if (dataAccount.mapLevelPow[symbolCandle] === undefined) {
                    dataAccount.mapLevelPow[symbolCandle] = 0;
                  }
                  dataAccount.orders.push(newOrder);
                  bot.sendMessage(
                    chatId,
                    `Thực hiện lệnh ${
                      typeOrder === "up" ? "LONG" : "SHORT"
                    } ${buildLinkToSymbol(symbolCandle)} tại giá ${price} - L${
                      dataAccount.mapLevelPow[symbolCandle]
                    }`,
                    { parse_mode: "HTML", disable_web_page_preview: true }
                  );
                }
              }
            });
          }

          if (!symbolWithCondition.length) {
            symbolWithCondition = temListSymbol;
          }
        });
      }

      bot.sendMessage(
        chatId,
        `Tài khoản hiện tại của bạn là ${dataAccount.account}$ và có ${dataAccount.orders.length} lệnh đang chạy, ${listSymbols.length}`
      );

      bot.sendMessage(
        chatId,
        `- Có ${countTP} lệnh đạt TP.\n- Có ${countSL} lệnh chạm SL.\n- Balance: ${balancePerRound}\n- Round: ${countRound}`
      );

      const mapListSymbolLevelPow = {};
      Object.keys(dataAccount.mapLevelPow).forEach((key) => {
        const level = dataAccount.mapLevelPow[key];
        if (+level) {
          if (Array.isArray(mapListSymbolLevelPow[level])) {
            mapListSymbolLevelPow[level].push(key);
          } else {
            mapListSymbolLevelPow[level] = [key];
          }
        }
      });

      const contentLevelPow = Object.keys(mapListSymbolLevelPow).map(
        (lvPow) => {
          return `- L${lvPow} - [${
            mapListSymbolLevelPow[lvPow].length
          }]: ${mapListSymbolLevelPow[lvPow].join(", ")}\n\n`;
        }
      );

      if (contentLevelPow.length) {
        bot.sendMessage(chatId, `${contentLevelPow.join("")}`);
      }
    }
  };

  setTimeout(() => {
    handleData(listSymbols);
    setInterval(() => {
      handleData(listSymbols);
      // console.log(JSON.stringify(dataAccount, null, 2));
    }, 1 * 60 * 1000);
  }, 0);
};
