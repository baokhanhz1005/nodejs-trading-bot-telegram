import {
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../utils.js";
import { getListHighest, isUpTrending } from "../../utils/handleDataCandle.js";

export const TestFunctionUtility = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  const listSymbols = await fetchApiGetListingSymbols();

  if (listSymbols && listSymbols.length) {
    const promiseCandleData = listSymbols
      .filter((each) => each.symbol === "BOMEUSDT")
      .map(async (token) => {
        const { symbol, stickPrice } = token;

        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 200, // 388 -- 676 -- 964
          },
        };

        const res = await fetchApiGetCandleStickData(params);

        return res;
      });

    Promise.all(promiseCandleData).then(async (res) => {
      if (res.length) {
        res.filter(Boolean).forEach((candleInfo) => {
          const { symbol: symbolCandle, data: candleStickData } = candleInfo;

          if (candleStickData && candleStickData.length) {
            const listHighest = getListHighest(candleStickData);
            const listHighestValue = listHighest.map((peak) => +peak.price);
            const isUpTrending = isUpTrending(listHighestValue, 2)

            // bot.sendMessage(chatId, `${listHighestValue.join(" -- ")}`);
          }
        });
      }
    });
  }
};
