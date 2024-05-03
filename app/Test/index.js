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
import { COST, REWARD, RR } from "../execute/ExecuteSMC/constant.js";
import { checkAbleOrderBySympleMethod } from "../execute/ExecuteSympleMethod/utils.js";

export const Test = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  const currentSecond = new Date().getSeconds();
  const timeRemaining = 60 - currentSecond;
  let countTP = 0;
  let countSL = 0;
  let payloadAccount;

  let countRound = 0;
  let limitResetPow = 10;
  let balancePerRound = 0;
  let symbolWithCondition = [];
  try {
    payloadAccount = TEST_CONFIG;
    console.log("Get from try");
  } catch (e) {
    console.log("Get from catch");
    payloadAccount = TEST_CONFIG;
  }

  const dataAccount = payloadAccount;

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

            const res = await fetchApiGetCandleStickData(params).catch(
              (error) => {
                console.error("Error fetching candlestick data:", error);
              }
            );

            listPromiseResult.push(res);
          }

          // check is has TP / SL
          Promise.allSettled(listPromiseResult).then((res) => {
            if (res.length) {
              res.forEach((result) => {
                if (result.status === "fulfilled") {
                  const candleInfo = result.value;
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
                } else if (result.status === "rejected") {
                  const reason = result.reason;
                  console.error("Request error:", reason);
                }
              });
            }
          });
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

          return fetchApiGetCandleStickData(params).catch((error) => {
            console.error("Error fetching candlestick data:", error);
          });
        });

        Promise.allSettled(listPromiseCandle).then((res) => {
          const temListSymbol = [];
          if (res.length) {
            res.forEach((result) => {
              if (result.status === "fulfilled") {
                const candleInfo = result.value;
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

                  const newestCandle = candleStickData.slice(-1);
                  const dateTimeCandle = new Date(newestCandle[0]);
                  const currentTime = new Date();
                  if (
                    Number(dateTimeCandle.getMinutes()) ===
                    Number(currentTime.getMinutes())
                  ) {
                    candleStickData.pop();
                  }
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
                    fetchApiGetCurrentPrice({
                      symbol: symbolCandle,
                    }).then(res => {
                      const { price } = res;

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
                        } ${buildLinkToSymbol(
                          symbolCandle
                        )} tại giá ${price} - L${
                          dataAccount.mapLevelPow[symbolCandle]
                        }`,
                        { parse_mode: "HTML", disable_web_page_preview: true }
                      );
                    }).catch((error) => {
                      console.error("Error fetching current price:", error);
                    });
                   
                  }
                }
              } else if (result.status === "rejected") {
                console.error("Request error");
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
    }, 1 * 100 * 1000);
  }, timeRemaining * 1000 + 250);
};
