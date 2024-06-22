import {
    buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { getAlertByType } from "../../../utils/handleDataCandle.js";
import { checkSafetyPrice } from "./utils.js";

export const TrackingPriceSafety = async (payload) => {
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
          limit: 50,
        },
      };

      const { data: candleStickData } = await fetchApiGetCandleStickData(
        params
      );
      if (candleStickData && candleStickData.length) {
        candleStickData.pop();
        candleStickData.reverse();
        const { isHasBigPrice, level, type, isBuySellSafety, index } =
          checkSafetyPrice(candleStickData, symbol);
        if (isHasBigPrice && isBuySellSafety && level >= 5) {
          const trend = type === "up" ? "TĂNG" : "GIẢM";
          count += 1;
          bot.sendMessage(
            chatId,
            `${getAlertByType(type)} Symbol ${buildLinkToSymbol(
              symbol
            )} có vùng mua an toàn trong xu hướng ${trend} ở khung thời gian ${timeLine} !! [${level}][${index}]`,
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
