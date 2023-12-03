import {
  buildLinkToSymbol,
  sendCurrentTime,
  timeToSpecificTime,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { checkExchangeBigPrice, isMarubozu } from "./utils.js";

export const TrackingEngulfing = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  const listSymbols = await fetchApiGetListingSymbols();
  let count = 0;
  if (listSymbols && listSymbols.length) {
    listSymbols.forEach(async (token, index) => {
      const { symbol, stickPrice } = token;
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: 3,
        },
      };
      const { data: candleStickData } = await fetchApiGetCandleStickData(
        params
      );

      if (candleStickData && candleStickData.length) {
        const [previousCandle, latestCandle, currentCandle] = candleStickData;

        const { isHasExchangeBigPrice, type } = checkExchangeBigPrice(
          latestCandle,
          previousCandle
        );
        const isMarubozuCandle = isMarubozu(latestCandle, type);
        const isEngulfing = isHasExchangeBigPrice && isMarubozuCandle;

        if (isEngulfing) {
          const textType = type === "up" ? "TĂNG" : "GIẢM";
          bot.sendMessage(
            chatId,
            `Symbol ${buildLinkToSymbol(
              symbol
            )} có engulfing ${textType} tại khung ${timeLine} !!`,
            { parse_mode: "HTML", disable_web_page_preview: true }
          );
          count += 1;
        }
      }
      if (index === listSymbols.length - 1 && !count) {
        bot.sendMessage(chatId, `Không tìm thấy symbol nào hiện tại.`);
      }
    });
  }
};
