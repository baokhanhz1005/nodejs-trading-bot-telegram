import crypto from "crypto";
import OrderServices from "../../../services/Order.js";
import { getQuantity } from "../utils.js";
import { TEST_CONFIG } from "../../../constant.js";
import { TYPE_MARKET } from "../contants.js";
export const OrderMarket = async (payload) => {
  const { symbol = "MANAUSDT", entry = 0.4591, sl, tp, type } = payload;

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
  console.log(resMarket);

  if (resMarket && resMarket.data && resMarket.data.orderId) {
    console.log("will handleeeeeeeeeeeee");
    const ratePriceTP =
      type === "up"
        ? 1 + TEST_CONFIG.tpPercent / 100
        : 1 - TEST_CONFIG.tpPercent / 100;
    const ratePriceSL =
      type === "up"
        ? 1 - TEST_CONFIG.slPercent / 100
        : 1 + TEST_CONFIG.slPercent / 100;

    [TYPE_MARKET.TAKE_PROFIT_MARKET, TYPE_MARKET.STOP_MARKET].forEach(
      async (type) => {
        const priceTake =
          type === TYPE_MARKET.TAKE_PROFIT_MARKET
            ? entry * ratePriceTP
            : entry * ratePriceSL;

        params.data.type = type;
        params.data.stopPrice = priceTake;
        params.data.side = side === "BUY" ? "SELL" : "BUY";

        delete params.data.newOrderRespType;
        delete params.data.leverage;

        // const paramsUpdate = {
        //   data: {
        //     symbol,
        //     side,
        //     quantity,
        //     orderId: resMarket.data.orderId,
        //     type,
        //     stopPrice: priceTake,
        //     closePosition: false,
        //     timestamp: Date.now(),
        //   },
        // };
        console.log(params);
        // set Take profit || Stop loss
        const res = await OrderServices.market(params);
        console.log("check resssssssssss...", res);
      }
    );
  }
};
