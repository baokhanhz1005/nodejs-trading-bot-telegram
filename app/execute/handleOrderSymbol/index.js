import {
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import OrderServices from "../../../services/Order.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { CONFIG_QUICK_TRADE } from "../ExecuteFOMO/config.js";

const { RR: RR_QUICK, RR_MANUAL_ORDER, isReverse = false } = CONFIG_QUICK_TRADE;
export const handleOrderSymbol = async (payload) => {
  const { bot, chatId, timeLine, command, RR = RR_QUICK } = payload;
  // ex: order ABCUSDT 1.232 up 1 isCheckHasCurrentOrder
  const arrayCommand = command.split(" ");

  let isExistOrder = false;

  const [
    nameCommand,
    symbolCmd = "",
    priceSL,
    typeOrder,
    cost = 1,
    isCheckHasCurrentOrder = "",
  ] = arrayCommand;

  if (true || isCheckHasCurrentOrder) {
    const res = await OrderServices.openAlgoOrders({
      data: {
        timestamp: Date.now(),
        recvWindow: 5000,
      },
    });

    const { data: listOpenOrderData } = res || {};

    // noti and delete order
    if (listOpenOrderData && listOpenOrderData.length) {
      // build thành Object
      isExistOrder = listOpenOrderData.some(
        (order) => order?.symbol.toLowerCase() === symbolCmd.toLowerCase(),
      );

      if (isExistOrder) {
        bot.sendMessage(chatId, `Has existing this order ${symbolCmd}`);
      }
    }
  }

  if (!isExistOrder) {
    const listSymbols = await fetchApiGetListingSymbols();

    const tokenInfo = listSymbols.find(
      (token) => token.symbol.toLowerCase() === symbolCmd.toLowerCase(),
    );
    if (tokenInfo) {
      const { symbol, stickPrice } = tokenInfo;

      const { price } = await fetchApiGetCurrentPrice({
        symbol,
      });

      const slPercent =
        typeOrder === "up"
          ? (price / priceSL - 1) * 100
          : (priceSL / price - 1) * 100;

      const volumeOrder = (+cost * 100) / +slPercent;

      const orderInfo = {
        symbol,
        entry: +price,
        stickPrice,
        tp: +slPercent * RR,
        sl: +slPercent,
        volumeOrder,
        type: typeOrder,
      };

      if (isReverse) {
        orderInfo.type = typeOrder === "up" ? "down" : "up";
        orderInfo.tp = +slPercent;
        orderInfo.sl = +slPercent * RR;
      }

      await OrderMarket(orderInfo);

      bot.sendMessage(
        chatId,
        `Đã order lệnh ${symbol} - ${orderInfo.type} \n- price: ${arrayCommand[2]}`,
      );
    } else {
      bot.sendMessage(
        chatId,
        `Lệnh Order với cú pháp:\n- ex: Order ABCUSDT 1.2323 up 4 \n ** Order {Mã Token} {price-SL} {up/down} {Cost}`,
      );
    }
  }
};
