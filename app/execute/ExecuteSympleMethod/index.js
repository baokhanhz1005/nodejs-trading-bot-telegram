import { CONFIG_EXEC_BIG_PRICE } from "../../../constant.js";
import AccountService from "../../../services/Account.js";
import OrderServices from "../../../services/Order.js";
import {
  buildLinkToSymbol,
  calculateTimeout15m,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPositionAccount,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { buildMessageTPSL } from "../../../utils/buildMessage.js";
import {
  getListHighest,
  getListLowest,
  shuffleArr,
} from "../../../utils/handleDataCandle.js";
import { checkHasBigPriceTrend } from "../../handlers/TrackingBigPriceTrend/utils.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { TYPE_MARKET } from "../../orders/contants.js";
import { checkAbleOrderBySympleMethod } from "./utils.js";

export const ExecuteSympleMethod = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  const isRunSingle = false;
  const isUseLevelPow = false;
  let countTP = 0;
  let countSL = 0;
  const tempMapListOrders = {};
  let listSymbolDeleteRemain = [];
  let listSymbolWithCondition = [];
  const mapLevelPow = {};
  let singleLevelPow = 0;
  let currentSingleOrder = {};
  const currentSecond = new Date().getSeconds();
  const timeRemaining = 60 - currentSecond;

  const mapOrderSimilarInfo = {
    // example
    // BNBUSDT: {
    //   orderSimilar: {
    //     //data order
    //   },
    //   countSimilar: 0,
    // },
    //......
  };

  process.on("uncaughtException", (e) => {
    console.error(`Something went wrong ... ${e}`);
  });

  const resetOrderSimilar = (symbol) => {
    if (mapOrderSimilarInfo[symbol]) {
      mapOrderSimilarInfo[symbol].orderSimilar = null;
      mapOrderSimilarInfo[symbol].countSimilar = 0;
    }
  };

  const checkIsHitSL = (symbolCandle, lastestCandle) => {
    let result = false;

    const symbolSimilarInfo = mapOrderSimilarInfo[symbolCandle] || {};

    const { orderSimilar, countSimilar } = symbolSimilarInfo;

    if (orderSimilar) {
      const { sl, type, tp, isReOrder = false } = orderSimilar;

      const maxPrice = lastestCandle[2];
      const minPrice = lastestCandle[3];

      if (
        (type === "up" && minPrice <= sl) ||
        (type === "down" && maxPrice >= sl)
      ) {
        if (false && countSimilar < 25) {
          // việc hit SL quá nhanh trong thời gian ngăn là dấu hiệu của sự đảo chiều nên ngăn chặn việc order lệnh này
          resetOrderSimilar(symbolCandle);
        } else {
          result = true;
        }
      } else if (
        !isReOrder &&
        ((type === "up" && maxPrice >= tp) ||
          (type === "down" && minPrice <= tp))
      ) {
        resetOrderSimilar(symbolCandle);
      } else if (countSimilar < 75) {
        mapOrderSimilarInfo[symbolCandle].countSimilar += 1;
      } else {
        resetOrderSimilar(symbolCandle);
      }
    }

    return result;
  };

  const handleReOrderSimilar = (symbolCandle, type, latestPrice) => {
    const symbolSimilarInfo = mapOrderSimilarInfo[symbolCandle] || {};
    const { orderSimilar, countSimilar } = symbolSimilarInfo;

    if (orderSimilar) {
      const { slPercent, tpPercent } = orderSimilar;

      const rateGap = 1; // standard - 1

      const ratePriceTP =
        type === "up"
          ? 1 + (tpPercent * rateGap) / 100
          : 1 - (tpPercent * rateGap) / 100;
      const ratePriceSL =
        type === "up"
          ? 1 - (slPercent * rateGap) / 100
          : 1 + (slPercent * rateGap) / 100;

      mapOrderSimilarInfo[symbolCandle] = {
        orderSimilar: {
          symbol: symbolCandle,
          type,
          sl: ratePriceSL * +latestPrice,
          tp: ratePriceTP * +latestPrice,
          slPercent,
          tpPercent,
          isReOrder: true,
        },
        countSimilar: 0,
      };
    }
  };

  const executeBOT = async () => {
    const timeMinute = new Date().getMinutes();
    const isHasTrackingData = timeMinute % 5 === 0; // use candle 5m
    const mapListOrders = {};
    let listSymbolOpenOrder = [];

    if (!isHasTrackingData) {
      try {
        const { data: listOpenOrderData } = await OrderServices.getList({
          data: {
            timestamp: Date.now(),
          },
        }).catch((err) => {
          console.error("Error when get list order: ", err);
        });

        // noti and delete order
        if (listOpenOrderData && listOpenOrderData.length) {
          // build thành Object
          listOpenOrderData.forEach((order) => {
            if (order) {
              mapListOrders[order.symbol] = [
                ...(mapListOrders[order.symbol] || []),
                order,
              ];
            }
          });

          if (listSymbolDeleteRemain.length) {
            listSymbolDeleteRemain.forEach((symb) => {
              if (
                !mapListOrders[symb] ||
                (mapListOrders[symb] && !mapListOrders[symb].length)
              ) {
                listSymbolDeleteRemain = [...listSymbolDeleteRemain].filter(
                  (each) => each !== symb
                );
              }
            });
            bot.sendMessage(
              chatId,
              `⚠⚠⚠⚠ ${listSymbolDeleteRemain.join(
                "--"
              )} chưa thể xóa các lệnh này được.`
            );
          }

          listSymbolOpenOrder = Object.keys(mapListOrders);

          for (const symbol of listSymbolOpenOrder) {
            if (
              mapListOrders[symbol].length &&
              (mapListOrders[symbol].every(
                (order) => order.type === TYPE_MARKET.STOP_MARKET
              ) ||
                mapListOrders[symbol].every(
                  (order) => order.type === TYPE_MARKET.TAKE_PROFIT_MARKET
                ))
            ) {
              // thực thi xóa lệnh tồn đọng do đã TP || SL
              const listPromiseDelete = mapListOrders[symbol].map(
                (orderDelete) => {
                  const { symbol: symbolDelete, orderId: orderIdDelete } =
                    orderDelete;

                  // nếu còn lệnh stop market ==> lệnh tp đã thực thi và ngược lại
                  return OrderServices.delete({
                    data: {
                      orderId: orderIdDelete,
                      symbol: symbolDelete,
                      timestamp: Date.now(),
                    },
                  });
                }
              );

              const { type: typeOrder, side } = mapListOrders[symbol][0];
              const isTakeProfit = typeOrder === TYPE_MARKET.STOP_MARKET;

              Promise.all(listPromiseDelete)
                .then((res) => {
                  if (res && res.length) {
                    for (const response of res) {
                      if (response.status === 200) {
                        // send mess thông báo đã TP/SL lệnh
                        if (isTakeProfit) {
                          countTP += 1;
                          mapLevelPow[symbol] = 0;
                          singleLevelPow = 0;
                        } else {
                          countSL += 1;
                          if (mapLevelPow[symbol] === 8) {
                            mapLevelPow[symbol] = 0;
                          } else if (isNaN(mapLevelPow[symbol])) {
                            mapLevelPow[symbol] = 1;
                          } else {
                            mapLevelPow[symbol] += 1;
                          }

                          // run single order mode
                          if (isRunSingle) {
                            if (singleLevelPow === 8) {
                              singleLevelPow = 0;
                            } else {
                              singleLevelPow += 1;
                            }
                          }
                        }

                        if (isRunSingle) {
                          currentSingleOrder = {};
                        }

                        bot.sendMessage(
                          chatId,
                          buildMessageTPSL(
                            isTakeProfit,
                            symbol,
                            side,
                            tempMapListOrders
                          ),
                          {
                            parse_mode: "HTML",
                            disable_web_page_preview: true,
                          }
                        );

                        delete mapListOrders[symbol];
                        delete tempMapListOrders[symbol];
                      } else {
                        bot.sendMessage(
                          chatId,
                          `⚠⚠⚠⚠\nKhông thể xóa symbol ${symbol}. Vui lòng kiểm tra lại`
                        );
                      }
                    }
                  }
                })
                .catch((err) => {
                  console.error(err);
                  bot.sendMessage(
                    chatId,
                    `⚠⚠⚠⚠ ${symbol} -- tôi không thể xóa lệnh tồn đọng này, vui lòng gỡ lệnh này giúp tôi.`
                  );
                  listSymbolDeleteRemain.push(symbol);
                });
            }
          }
        }

        // // check order is hit SL ??
        // const promiseListOrderSimilar = Object.keys(mapOrderSimilarInfo)
        //   .map(async (key) => {
        //     if (mapOrderSimilarInfo[key]?.orderSimilar) {
        //       const params = {
        //         data: {
        //           symbol: key,
        //           interval: timeLine,
        //           limit: 2,
        //         },
        //       };
        //       return fetchApiGetCandleStickData(params);
        //     }

        //     return null;
        //   })
        //   .filter(Boolean);

        // await Promise.allSettled(promiseListOrderSimilar).then((results) => {
        //   for (const result of results) {
        //     if (result.status === "fulfilled") {
        //       const candleInfo = result.value;

        //       if (candleInfo) {
        //         const { symbol: symbolCandle, data: candleStickData } =
        //           candleInfo;

        //         if (candleStickData && candleStickData.length) {
        //           const newestCandle = candleStickData.slice(-1)[0];

        //           const symbolSimilarInfo = mapOrderSimilarInfo[symbolCandle];

        //           const { orderSimilar, countSimilar, isHitSL } =
        //             symbolSimilarInfo;

        //           const { sl, type, tp } = orderSimilar;

        //           const maxPrice = newestCandle[2];
        //           const minPrice = newestCandle[3];
        //           const currentPrice = newestCandle[4];

        //           if (
        //             (type === "up" && minPrice <= sl) ||
        //             (type === "down" && maxPrice >= sl)
        //           ) {
        //             if (false && countSimilar < 120) {
        //               // việc hit SL quá nhanh trong thời gian ngăn là dấu hiệu của sự đảo chiều nên ngăn chặn việc order lệnh này
        //               resetOrderSimilar(symbolCandle);
        //             } else {
        //               mapOrderSimilarInfo[symbolCandle].isHitSL = true;
        //             }
        //           } else if (
        //             (type === "up" && maxPrice >= tp) ||
        //             (type === "down" && minPrice <= tp)
        //           ) {
        //             resetOrderSimilar(symbolCandle);
        //           } else if (countSimilar < 375) {
        //             mapOrderSimilarInfo[symbolCandle].countSimilar += 1;
        //           } else {
        //             resetOrderSimilar(symbolCandle);
        //           }
        //         }
        //       }
        //     } else {
        //       console.error(
        //         `Failed to fetch candle data for symbol: ${result.reason}`
        //       );
        //     }
        //   }
        // });
      } catch (error) {
        console.error(error);
      }
    } else {
      if (listSymbols) {
        try {
          let listSymbolGetCandle = shuffleArr(listSymbolWithCondition);
          if (!listSymbolWithCondition.length) {
            listSymbolGetCandle = listSymbols;
          }
          const promiseCandleData = listSymbolGetCandle
            .map(async (token) => {
              const { symbol, stickPrice } = token;
              const params = {
                data: {
                  symbol: symbol,
                  interval: timeLine,
                  limit: 150,
                },
              };
              if (stickPrice <= 3) {
                return null;
              }
              return fetchApiGetCandleStickData(params).catch((err) =>
                console.error("Error when get candle", err)
              );
            })
            .filter(Boolean);

          let listOrderInfo = [];

          await Promise.allSettled(promiseCandleData)
            .then((results) => {
              const temListSymbol = [];
              for (const result of results) {
                if (result.status === "fulfilled") {
                  const candleInfo = result.value;
                  if (candleInfo) {
                    const { symbol: symbolCandle, data: candleStickData } =
                      candleInfo;

                    if (candleStickData && candleStickData.length) {
                      const newestCandle = candleStickData.slice(-1)[0];
                      const dateTimeCandle = new Date(newestCandle[0]);
                      const currentTime = new Date();
                      if (
                        Number(dateTimeCandle.getMinutes()) ===
                        Number(currentTime.getMinutes())
                      ) {
                        candleStickData.pop();
                      }

                      const lastestCandle = candleStickData.slice(-1)[0];

                      const lastestCandlePrice = lastestCandle[4];

                      if (mapOrderSimilarInfo[symbolCandle]?.orderSimilar) {
                        const isCurrentHitSLSimilar = checkIsHitSL(
                          symbolCandle,
                          lastestCandle
                        );

                        if (isCurrentHitSLSimilar) {
                          let { symbol, type, tpPercent, slPercent } =
                            mapOrderSimilarInfo[symbolCandle]?.orderSimilar ||
                            {};

                          let typeOrder = type;

                          // list peak
                          const listHighest = getListHighest(
                            candleStickData,
                            10
                          );
                          const listHighestValue = listHighest.map(
                            (peak) => +peak.price
                          );
                          const lastestPeakPrice =
                            listHighestValue.slice(-1)[0];

                          // list lowest
                          const listLowest = getListLowest(candleStickData, 10);
                          const listLowestValue = listLowest.map(
                            (candle) => +candle.price
                          );
                          const lastestLowestPrice =
                            listLowestValue.slice(-1)[0];

                          if (
                            type === "up" &&
                            lastestCandle[4] * 1.015 <= lastestLowestPrice
                          ) {
                            typeOrder = "down";
                            handleReOrderSimilar(
                              symbolCandle,
                              "down",
                              lastestCandle[4]
                            );
                          } else if (
                            type === "down" &&
                            lastestCandle[4] * 0.985 >= lastestPeakPrice
                          ) {
                            typeOrder = "up";
                            handleReOrderSimilar(
                              symbolCandle,
                              "up",
                              lastestCandle[4]
                            );
                          } else {
                            const { stickPrice } =
                              listSymbols.find(
                                (each) => each.symbol === symbolCandle
                              ) || {};

                            tpPercent = tpPercent * 3;
                            slPercent = slPercent * 3;

                            listOrderInfo.push({
                              symbol,
                              type: typeOrder,
                              tpPercent,
                              slPercent,
                              stickPrice,
                              levelPow: isUseLevelPow
                                ? mapLevelPow[symbolCandle] || 0
                                : 0,
                              lastestCandlePrice,
                            });
                            resetOrderSimilar(symbolCandle);
                          }
                        }
                      } else {
                        const {
                          isAbleOrder,
                          type,
                          tpPercent,
                          slPercent,
                          timeStamp = "",
                        } = checkAbleOrderBySympleMethod(
                          candleStickData,
                          symbolCandle
                        ) || {};

                        if (
                          lastestCandlePrice <= 5 &&
                          !listSymbolWithCondition.length
                        ) {
                          const symbolInfo = listSymbols.find(
                            (each) => each.symbol === symbolCandle
                          );
                          temListSymbol.push(symbolInfo);
                        }

                        const isHasOrderRunning =
                          !!tempMapListOrders[symbolCandle];

                        const isHasSingleOrder =
                          !!Object.keys(currentSingleOrder).length;

                        const isAllowGetOrder = isRunSingle
                          ? !isHasSingleOrder
                          : !isHasOrderRunning;

                        if (
                          isAbleOrder &&
                          symbolCandle !== "RSRUSDT" &&
                          isAllowGetOrder &&
                          (listSymbolWithCondition.length
                            ? true
                            : lastestCandlePrice <= 5)
                        ) {
                          if (!mapLevelPow[symbolCandle]) {
                            mapLevelPow[symbolCandle] = 0;
                          }

                          const rateGap = 3; // standard - 1

                          const ratePriceTP =
                            type === "up"
                              ? 1 + (tpPercent * rateGap) / 100
                              : 1 - (tpPercent * rateGap) / 100;
                          const ratePriceSL =
                            type === "up"
                              ? 1 - (slPercent * rateGap) / 100
                              : 1 + (slPercent * rateGap) / 100;

                          mapOrderSimilarInfo[symbolCandle] = {
                            orderSimilar: {
                              symbol: symbolCandle,
                              type,
                              sl: ratePriceSL * +lastestCandlePrice,
                              tp: ratePriceTP * +lastestCandlePrice,
                              slPercent,
                              tpPercent,
                            },
                            countSimilar: 0,
                          };

                        }

                      }
                    }
                  }
                } else {
                  console.error(
                    `Failed to fetch candle data for symbol: ${result.reason}`
                  );
                }
              }

              if (!listSymbolWithCondition.length) {
                listSymbolWithCondition = temListSymbol;
              }
            })
            .catch((err) => {
              console.error(
                "Some thing went wrong while get candle stick data",
                err
              );
            });

          try {
            if (isRunSingle) {
              if (!Object.keys(currentSingleOrder).length) {
                const orderInfo = listOrderInfo.filter(Boolean)[0];
                if (orderInfo) {
                  orderInfo.levelPow = singleLevelPow;
                  await handleOrder(orderInfo);
                }
              }
            } else {
              await Promise.allSettled(
                listOrderInfo.filter(Boolean).map(handleOrder)
              );
            }
          } catch (error) {
            console.error(error);
          }
        } catch (error) {
          console.error(error);
        }
      }

      // Noti tài khoản hiện tại
      const resAccount = await AccountService.info({
        data: {
          timestamp: Date.now(),
        },
      });

      if (resAccount?.data) {
        const { totalWalletBalance: accountBalance } = resAccount?.data || {};
        bot.sendMessage(
          chatId,
          `📊📊📊📊\n- Tài khoản hiện tại của bạn là: ${+accountBalance}\n- Có ${countTP} lệnh đạt Take Profit ✅\n- Có ${countSL} lệnh chạm Stop Loss ❌\n- Hiện tại có ${
            Object.keys(tempMapListOrders).length
          } lệnh đang chạy...\n♻${
            listSymbolWithCondition.length
          }\n - Single level: ${singleLevelPow}`
        );
      }
    }
  };

  const handleOrder = async (payload) => {
    try {
      const {
        symbol,
        type,
        tpPercent,
        slPercent,
        stickPrice,
        levelPow,
        lastestCandlePrice,
      } = payload;
      //   const data = await fetchApiGetCurrentPrice({
      //     symbol,
      //   });
      //   const { price } = data;
      const price = lastestCandlePrice;
      if (price) {
        await OrderMarket({
          symbol,
          entry: +price,
          type,
          stickPrice,
          tp: tpPercent,
          sl: slPercent,
          levelPow,
        });

        const ratePriceTP =
          type === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
        const ratePriceSL =
          type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

        const newOrder = {
          symbol,
          entry: +price,
          tp: ratePriceTP * price,
          sl: ratePriceSL * price,
          type,
          levelPow,
        };
        tempMapListOrders[symbol] = newOrder;
        if (isRunSingle) {
          currentSingleOrder = newOrder;
        }
        bot.sendMessage(
          chatId,
          `${type === "up" ? "☘☘☘☘" : "🍁🍁🍁🍁"}\n Thực hiện lệnh ${
            type === "up" ? "LONG" : "SHORT"
          } ${symbol}  tại giá ${price} \n - Open chart: ${buildLinkToSymbol(
            symbol
          )} - L${levelPow}\n - Single level: ${singleLevelPow}`,
          { parse_mode: "HTML", disable_web_page_preview: true }
        );
      }
    } catch (error) {
      console.error("Something went wrong...", error);
    }
  };

  setTimeout(() => {
    executeBOT();
    setInterval(() => {
      executeBOT();
    }, 1 * 60 * 1000);
  }, timeRemaining * 1000 + 500);
};
