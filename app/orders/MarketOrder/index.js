import OrderServices from "../../../services/Order.js";
import { getQuantity } from "../utils.js";
import { CONFIG_EXEC_BIG_PRICE, TEST_CONFIG } from "../../../constant.js";
import { TYPE_MARKET } from "../contants.js";
import { REWARD } from "../../execute/ExecuteSMC/constant.js";

export const OrderMarket = async (payload) => {
  const {
    symbol,
    entry,
    type,
    stickPrice,
    tp,
    sl,
    levelPow = 0,
    volumeOrder = "",
  } = payload;

  // Thực thi 1 lệnh market và lấy orderId
  const side = type === "up" ? "BUY" : "SELL";
  const volume = volumeOrder || (REWARD * Math.pow(2, levelPow) * 100) / sl;
  const quantity = getQuantity(entry, volume);

  if (!quantity) return;

  const { data: listOpenOrderData } = await OrderServices.getList({
    data: {
      timestamp: Date.now(),
    },
  }).catch((err) => {
    console.error("Error when get list order: ", err);
  });

  const isExistOrder = listOpenOrderData.some(
    (order) => order?.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (isExistOrder) {
    console.warn("Order already exists for symbol:", symbol);
    return;
  }

  const params = {
    data: {
      symbol,
      side,
      type: "MARKET",
      quantity,
      leverage: 10,
      newOrderRespType: "RESULT",
      timestamp: Date.now(),
    },
  };

  const resMarket = await OrderServices.market(params).catch((err) =>
    console.error("Error when order:", err),
  );

  if (resMarket && resMarket.data && resMarket.data.orderId) {
    const ratePriceTP = type === "up" ? 1 + tp / 100 : 1 - tp / 100;
    const ratePriceSL = type === "up" ? 1 - sl / 100 : 1 + sl / 100;

    [TYPE_MARKET.TAKE_PROFIT_MARKET, TYPE_MARKET.STOP_MARKET].forEach(
      async (type) => {
        const priceTake =
          type === TYPE_MARKET.TAKE_PROFIT_MARKET
            ? entry * ratePriceTP
            : entry * ratePriceSL;

        params.data.type = type;
        params.data.triggerPrice = priceTake.toFixed(+stickPrice);
        params.data.side = side === "BUY" ? "SELL" : "BUY";
        params.data.timestamp = Date.now();
        params.data.closePosition = true;
        params.data.algoType = "CONDITIONAL";

        delete params.data.newOrderRespType;
        delete params.data.leverage;
        delete params.data.quantity;

        // set Take profit || Stop loss
        await OrderServices.algoMarket(params).catch((err) =>
          console.error("Error when set TP SL:", err),
        );
      },
    );
  }
};
