import {
  buildLinkToSymbol,
  sendCurrentTime,
  timeUntilNextHour,
} from "../../utils.js";
import { isEngulfing, isMarubozu } from "./utils.js";
import {
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../utils.js";

export const TrackingEngulfing = async (payload) => {
  const { bot, chatId, timeLine } = payload;

  const listSymbols = await fetchApiGetListingSymbols();
  let count = 0;
  if (listSymbols && listSymbols.length) {
    listSymbols.forEach(async (symbol, index) => {
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: 2,
        },
      };
      const candleStickData = await fetchApiGetCandleStickData(params);

      if (candleStickData && candleStickData.length) {
        const [latestCandle, previousCandle] = candleStickData;

        const { isEngulfing: isEngulfingCandle, type } = isEngulfing(latestCandle, previousCandle);
        const isMarubozuCandle = isMarubozu(latestCandle, type);
        if (isMarubozuCandle && isEngulfingCandle) {
          const textType = type === 'up' ? 'TĂNG' : 'GIẢM';
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
