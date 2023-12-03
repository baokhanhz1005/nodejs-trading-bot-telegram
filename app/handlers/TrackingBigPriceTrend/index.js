import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { checkHasBigPriceTrend } from "./utils.js";

export const TrackingBigPriceTrend = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  let count = 0;
  if (listSymbols && listSymbols.length) {
    listSymbols.forEach(async (symbol, index) => {
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: 50,
        },
      };

      const { data: candleStickData } = await fetchApiGetCandleStickData(
        params
      );
      if (candleStickData && candleStickData.length) {
        candleStickData.pop();
        const { isHasBigPrice, level, type } = checkHasBigPriceTrend(
          candleStickData,
          symbol
        );

        if (isHasBigPrice && level >= 5) {
          const trend = type === "up" ? "TĂNG" : "GIẢM";
          count += 1;
          bot.sendMessage(
            chatId,
            `Symbol ${buildLinkToSymbol(
              symbol
            )} có lực ${trend} mạnh tại khung ${timeLine} !! [${level}]`,
            { parse_mode: "HTML", disable_web_page_preview: true }
          );
        }
      }
      if (index === listSymbols.length - 1 && !count) {
        bot.sendMessage(chatId, `Không tìm thấy symbol nào hiện tại.`);
      }
    });
  }
};
