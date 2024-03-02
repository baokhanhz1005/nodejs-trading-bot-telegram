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
import { checkHasBigPriceTrend } from "../../handlers/TrackingBigPriceTrend/utils.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { TYPE_MARKET } from "../../orders/contants.js";
import { checkIsAllowTakeOrder } from "./utils.js";

export const ExecuteBigPriceTrendV2 = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();

  let countTP = 0;
  let countSL = 0;
  const tempMapListOrders = {};
  let candleForCheck = [];
  let timeWaiting = 0;
  let currentTime = new Date().getMinutes();
  while (currentTime && currentTime % 3 !== 0) {
    timeWaiting += 1;
    currentTime += 1;
  }

  const executeBOT = async () => {
    const timeMinute = new Date().getMinutes();
    const timeHour = new Date().getHours();
    let isHasTrackingData = false;
    const mapListOrders = {};
    let listSymbolOpenOrder = [];
    // const listPositionOrder = await fetchApiGetCurrentPositionAccount();

    switch (timeLine) {
      case "15m":
        isHasTrackingData = [0, 15, 30, 45].includes(timeMinute);
        break;

      case "1h":
        isHasTrackingData = [0].includes(timeMinute);
        break;

      case "4h":
        isHasTrackingData = [0].includes(timeMinute) && timeHour % 4 === 0;
        break;

      default:
        break;
    }

    const { data: listOpenOrderData } = await OrderServices.getList({
      data: {
        timestamp: Date.now(),
      },
    });

    // build thành Object
    listOpenOrderData.forEach((order) => {
      if (order) {
        mapListOrders[order.symbol] = [
          ...(mapListOrders[order.symbol] || []),
          order,
        ];
      }
    });

    listSymbolOpenOrder = Object.keys(mapListOrders);

    listSymbolOpenOrder = listSymbolOpenOrder
      .map(async (symbol) => {
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
          mapListOrders[symbol].forEach(async (orderDelete) => {
            const { symbol: symbolDelete, orderId: orderIdDelete } =
              orderDelete;

            // nếu còn lệnh stop market ==> lệnh tp đã thực thi và ngược lại
            await OrderServices.delete({
              data: {
                orderId: orderIdDelete,
                symbol: symbolDelete,
                timestamp: Date.now(),
              },
            });
          });
          const { type: typeOrder, side } = mapListOrders[symbol][0];
          const isTakeProfit = typeOrder === TYPE_MARKET.STOP_MARKET;
          // send mess thông báo đã TP/SL lệnh
          bot.sendMessage(
            chatId,
            buildMessageTPSL(isTakeProfit, symbol, side, tempMapListOrders),
            {
              parse_mode: "HTML",
              disable_web_page_preview: true,
            }
          );
          if (isTakeProfit) {
            countTP += 1;
          } else {
            countSL += 1;
          }

          delete mapListOrders[symbol];
          delete tempMapListOrders[symbol];

          return null;
        } else {
          return symbol;
        }
      })
      .filter(Boolean);

    // if (listOpenOrderData.length !== listPositionOrder.length) {
    //   const newListPositionOrder = listPositionOrder.map((data) => data.symbol);
    //   const symbolAlerts = listOpenOrderData.filter(
    //     (symbol) => !newListPositionOrder.includes(symbol)
    //   );

    //   symbolAlerts.forEach((symb) => {
    //     bot.sendMessage(
    //       chatId,
    //       `${symb} hiện không thể hủy lệnh, vui lòng kiểm tra giúp tôi. !!!`
    //     );
    //   });
    // }

    if (candleForCheck.length) {
      candleForCheck.forEach(async (candle) => {
        const { symbol, type, stickPrice, priceData } = candle;

        const isAllowTakeOrder = await checkIsAllowTakeOrder(
          symbol,
          type,
          timeLine,
          priceData
        );

        if (isAllowTakeOrder) {
          candleForCheck = candleForCheck.filter(
            (candle) => candle.symbol !== symbol
          );
          const data = await fetchApiGetCurrentPrice({
            symbol,
          });
          const { price } = data;

          if (price && price <= CONFIG_EXEC_BIG_PRICE.limitVolume) {
            // call api order MARKET symbol này và đặt TP + SL
            await OrderMarket({
              symbol,
              entry: +price,
              type,
              stickPrice,
            });

            const ratePriceTP =
              type === "up"
                ? 1 + CONFIG_EXEC_BIG_PRICE.tpPercent / 100
                : 1 - CONFIG_EXEC_BIG_PRICE.tpPercent / 100;
            const ratePriceSL =
              type === "up"
                ? 1 - CONFIG_EXEC_BIG_PRICE.slPercent / 100
                : 1 + CONFIG_EXEC_BIG_PRICE.slPercent / 100;
            const newOrder = {
              symbol,
              entry: +price,
              tp: ratePriceTP * price,
              sl: ratePriceSL * price,
              type,
            };
            tempMapListOrders[symbol] = newOrder;

            bot.sendMessage(
              chatId,
              `Thực hiện lệnh ${
                type === "up" ? "LONG" : "SHORT"
              } ${symbol}  tại giá ${price} \n - Open chart: ${buildLinkToSymbol(
                symbol
              )}`,
              { parse_mode: "HTML", disable_web_page_preview: true }
            );
          }
        }
      });
    }

    if (isHasTrackingData) {
      const newListCandleForCheck = [];
      // Thông báo số lệnh còn lại
      bot.sendMessage(
        chatId,
        `Hiện tại đang có ${listSymbolOpenOrder.length} lệnh đang chạy...`
      );

      bot.sendMessage(
        chatId,
        `Có ${countTP} lệnh đạt TP. \n
       Có ${countSL} lệnh chạm SL.
      `
      );

      if (listSymbolOpenOrder.length < CONFIG_EXEC_BIG_PRICE.limitOrder) {
        if (listSymbols && listSymbols.length) {
          listSymbols.forEach(async (token, index) => {
            const { symbol, stickPrice } = token;
            const params = {
              data: {
                symbol: symbol,
                interval: timeLine,
                limit: 50,
              },
            };
            const { data: candleStickData } = await fetchApiGetCandleStickData(
              params
            );

            if (candleStickData && candleStickData.length) {
              candleStickData.pop();
              const { isHasBigPrice, level, type } = checkHasBigPriceTrend(
                candleStickData,
                symbol
              );

              if (
                isHasBigPrice &&
                level >= 6 &&
                listSymbolOpenOrder.every((order) => order !== symbol)
              ) {
                const data = await fetchApiGetCurrentPrice({
                  symbol,
                });
                const { price } = data;

                if (price && price <= CONFIG_EXEC_BIG_PRICE.limitVolume) {
                  // call api order MARKET symbol này và đặt TP + SL
                  let typeData = type;

                  // if (true) {
                  //   typeData = type === "up" ? "down" : "up";
                  // }

                  await OrderMarket({
                    symbol,
                    entry: +price,
                    type: typeData,
                    stickPrice,
                  });

                  const ratePriceTP =
                    typeData === "up"
                      ? 1 + CONFIG_EXEC_BIG_PRICE.tpPercent / 100
                      : 1 - CONFIG_EXEC_BIG_PRICE.tpPercent / 100;
                  const ratePriceSL =
                    typeData === "up"
                      ? 1 - CONFIG_EXEC_BIG_PRICE.slPercent / 100
                      : 1 + CONFIG_EXEC_BIG_PRICE.slPercent / 100;
                  const newOrder = {
                    symbol,
                    entry: +price,
                    tp: ratePriceTP * price,
                    sl: ratePriceSL * price,
                    type: typeData,
                  };
                  tempMapListOrders[symbol] = newOrder;

                  bot.sendMessage(
                    chatId,
                    `Thực hiện lệnh ${
                      typeData === "up" ? "LONG" : "SHORT"
                    } ${symbol}  tại giá ${price} \n - Open chart: ${buildLinkToSymbol(
                      symbol
                    )}`,
                    { parse_mode: "HTML", disable_web_page_preview: true }
                  );
                }

                // const newCandleData = {
                //   symbol,
                //   type,
                //   stickPrice,
                //   priceData: candleStickData[candleStickData.length - 1],
                // };

                // newListCandleForCheck.push(newCandleData);
              }
            }
          });
        }
      }
      // update list candle for check entry
      candleForCheck = newListCandleForCheck;
    }
  };

  console.log(timeWaiting);

  setTimeout(() => {
    executeBOT();
    setInterval(() => {
      executeBOT();
    }, 90000);
  }, timeWaiting * 1000);
};
