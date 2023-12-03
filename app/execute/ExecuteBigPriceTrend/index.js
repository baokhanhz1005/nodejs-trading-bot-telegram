import { CONFIG_EXEC_BIG_PRICE } from "../../../constant.js";
import AccountService from "../../../services/Account.js";
import OrderServices from "../../../services/Order.js";
import {
  buildLinkToSymbol,
  calculateTimeout15m,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { buildMessageTPSL } from "../../../utils/buildMessage.js";
import { checkHasBigPriceTrend } from "../../handlers/TrackingBigPriceTrend/utils.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { TYPE_MARKET } from "../../orders/contants.js";

export const ExecuteBigPriceTrend = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  const tempMapListOrders = {};

  const executeBOT = async () => {
    // Noti tài khoản hiện tại
    const resAccount = await AccountService.info({
      data: {
        timestamp: Date.now(),
      },
    });
    const { totalWalletBalance: accountBalance } = resAccount.data;
    bot.sendMessage(
      chatId,
      `Tài khoản hiện tại của bạn là: ${+accountBalance}`
    );

    // Call api lấy danh sách orders hiện tại của account này
    const mapListOrders = {};

    const listOrderRes = await OrderServices.getList({
      data: {
        timestamp: Date.now(),
      },
    });
    const listOrder = listOrderRes.data;
    listOrder.forEach((order) => {
      if (order) {
        mapListOrders[order.symbol] = [
          ...(mapListOrders[order.symbol] || []),
          order,
        ];
      }
    });
    let listSymbolOrder = Object.keys(mapListOrders);

    listSymbolOrder = listSymbolOrder.map(async (symbol) => {
      if (mapListOrders[symbol].length < 2) {
        // thực thi xóa lệnh tồn đọng do đã TP || SL
        const orderDelete = mapListOrders[symbol][0];
        const {
          symbol: symbolDelete,
          orderId: orderIdDelete,
          type: typeOrder,
          side,
        } = orderDelete;

        // nếu còn lệnh stop market ==> lệnh tp đã thực thi
        const isTakeProfit = typeOrder === TYPE_MARKET.STOP_MARKET;
        await OrderServices.delete({
          data: {
            orderId: orderIdDelete,
            symbol: symbolDelete,
            timestamp: Date.now(),
          },
        });
        // send mess thông báo đã TP/SL lệnh
        bot.sendMessage(
          chatId,
          buildMessageTPSL(isTakeProfit, symbol, side, tempMapListOrders),
          {
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }
        );

        delete mapListOrders[symbol];
        delete tempMapListOrders[symbol];
      } else {
        return symbol;
      }
    });

    // Thông báo số lệnh còn lại
    bot.sendMessage(
      chatId,
      `Hiện tại có ${listSymbolOrder.length} đang chạy...`
    );

    if (listSymbolOrder.length < CONFIG_EXEC_BIG_PRICE.limitOrder) {
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
              level >= 5 &&
              listSymbolOrder.every((order) => order !== symbol)
            ) {
              const data = await fetchApiGetCurrentPrice({
                symbol,
              });
              const { price } = data;

              if (price <= CONFIG_EXEC_BIG_PRICE.limitVolume) {
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
                  } ${symbol} - Open chart: ${buildLinkToSymbol(
                    symbol
                  )} tại giá ${price}`,
                  { parse_mode: "HTML", disable_web_page_preview: true }
                );
              }
            }
          }
        });
      }
    }
  };
  console.log(calculateTimeout15m(0.5));
  setTimeout(() => {
    executeBOT();
    setInterval(() => {
      executeBOT();
    }, 15 * 60 * 1000);
  }, calculateTimeout15m(0.5));
};
