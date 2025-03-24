import {
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import OrderServices from "../../../services/Order.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { CONFIG_QUICK_TRADE } from "../ExecuteFOMO/config.js";

const { RR: RR_QUICK, RR_MANUAL_ORDER } = CONFIG_QUICK_TRADE;
export const handleOrderSymbol = async (payload) => {
  const {
    bot,
    chatId,
    timeLine,
    command,
    RR = RR_MANUAL_ORDER || RR_QUICK,
  } = payload;
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

  if (isCheckHasCurrentOrder) {
    const res = await OrderServices.getList({
      data: {
        timestamp: Date.now(),
      },
    }).catch((err) => {
      console.error("Error when get list order: ", err);
    });

    const { data: listOpenOrderData } = res || {};

    // noti and delete order
    if (listOpenOrderData && listOpenOrderData.length) {
      // build thành Object
      listOpenOrderData.forEach((order) => {
        if (order?.symbol.toLowerCase() === symbolCmd.toLowerCase()) {
          isExistOrder = true;
          bot.sendMessage(chatId, `Has existing this order ${symbolCmd}`);
        }
      });
    }
  }

  if (!isExistOrder) {
    const listSymbols = await fetchApiGetListingSymbols();

    const tokenInfo = listSymbols.find(
      (token) => token.symbol.toLowerCase() === symbolCmd.toLowerCase()
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

      await OrderMarket(orderInfo);

      bot.sendMessage(
        chatId,
        `Đã order lệnh ${symbol} - ${orderInfo.type} \n- price: ${arrayCommand[2]}`
      );
    } else {
      bot.sendMessage(
        chatId,
        `Lệnh Order với cú pháp:\n- ex: Order ABCUSDT 1.2323 up 4 \n ** Order {Mã Token} {price-SL} {up/down} {Cost}`
      );
    }
  }
};
