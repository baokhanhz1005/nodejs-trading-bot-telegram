import OrderServices from "../../../services/Order.js";
import { getQuantity } from "../utils.js";
import { CONFIG_EXEC_BIG_PRICE, TEST_CONFIG } from "../../../constant.js";
import { TYPE_MARKET } from "../contants.js";

export const OrderMarket = async (payload) => {
  const { symbol, entry, type, stickPrice } = payload;

  // Thực thi 1 lệnh market và lấy orderId
  const side = type === "up" ? "BUY" : "SELL";
  const quantity = getQuantity(entry);
  const params = {
    data: {
      symbol,
      side,
      type: "MARKET",
      quantity,
      leverage: 20,
      newOrderRespType: "RESULT",
      timestamp: Date.now(),
    },
  };

  const resMarket = await OrderServices.market(params);

  if (resMarket && resMarket.data && resMarket.data.orderId) {
    const ratePriceTP =
      type === "up"
        ? 1 + CONFIG_EXEC_BIG_PRICE.tpPercent / 100
        : 1 - CONFIG_EXEC_BIG_PRICE.tpPercent / 100;
    const ratePriceSL =
      type === "up"
        ? 1 - CONFIG_EXEC_BIG_PRICE.slPercent / 100
        : 1 + CONFIG_EXEC_BIG_PRICE.slPercent / 100;

    [TYPE_MARKET.TAKE_PROFIT_MARKET, TYPE_MARKET.STOP_MARKET].forEach(
      async (type) => {
        const priceTake =
          type === TYPE_MARKET.TAKE_PROFIT_MARKET
            ? entry * ratePriceTP
            : entry * ratePriceSL;

        params.data.type = type;
        params.data.stopPrice = priceTake.toFixed(+stickPrice);
        params.data.side = side === "BUY" ? "SELL" : "BUY";
        params.data.timestamp = Date.now();

        delete params.data.newOrderRespType;
        delete params.data.leverage;

        // set Take profit || Stop loss
        await OrderServices.market(params);
      }
    );
  }
};
