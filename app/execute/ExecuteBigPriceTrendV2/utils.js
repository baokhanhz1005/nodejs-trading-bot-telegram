import { CONFIG_EXEC_BIG_PRICE } from "../../../constant.js";
import { fetchApiGetCandleStickData } from "../../../utils.js";

export const checkIsAllowTakeOrder = async (
  symbol,
  type,
  timeLine,
  priceData
) => {
  let result = false;

  let isHasPullbackPrice = false;

  const exchangePrice = Math.abs(priceData[1] - priceData[4]);
  const params = {
    data: {
      symbol: symbol,
      interval: timeLine,
      limit: 1,
    },
  };

  const { data: candleStickData } = await fetchApiGetCandleStickData(params);

  if (candleStickData && candleStickData.length) {
    const currentPrice = candleStickData[0][4];
    if (type === "up") {
      const minPricePullback =
        priceData[4] -
        (CONFIG_EXEC_BIG_PRICE.percentPullbackLowest * exchangePrice) / 100; // giá tối thiểu để khi pull back cho phép vào lệnh
      const maxPricePullback =
        priceData[4] -
        (CONFIG_EXEC_BIG_PRICE.percentPullbackHighest * exchangePrice) / 100; // giá tối thiểu để khi pull back cho phép vào lệnh

      isHasPullbackPrice =
        currentPrice <= minPricePullback && currentPrice >= maxPricePullback;
    } else if (type === "down") {
      const minPricePullback =
        priceData[4] +
        (CONFIG_EXEC_BIG_PRICE.percentPullbackLowest * exchangePrice) / 100; // giá tối thiểu để khi pull back cho phép vào lệnh
      const maxPricePullback =
        priceData[4] +
        (CONFIG_EXEC_BIG_PRICE.percentPullbackHighest * exchangePrice) / 100; // giá tối thiểu để khi pull back cho phép vào lệnh

      isHasPullbackPrice =
        currentPrice >= minPricePullback && currentPrice <= maxPricePullback;
    }
  }
  result = isHasPullbackPrice; // will expand

  return result;
};
