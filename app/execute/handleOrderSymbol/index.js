import {
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";

export const handleOrderSymbol = async (payload) => {
  const { bot, chatId, timeLine, command, RR = 1 } = payload;
  // ex: order ABCUSDT 1.232 up 1

  const listSymbols = await fetchApiGetListingSymbols();
  const arrayCommand = command.split(" ");

  const [nameCommand, symbolCmd, priceSL, typeOrder, cost = 1] = arrayCommand;

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
};
