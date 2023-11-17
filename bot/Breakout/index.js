import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../utils.js";
import { findMinMaxPriceCandle, isBreakOut } from "./utils.js";

export const BreakOut = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  let count = 0;
  if (listSymbols && listSymbols.length) {
    listSymbols.forEach(async (symbol, index) => {
      const params = {
        data: {
          symbol: symbol,
          interval: timeLine,
          limit: 40,
        },
      };
      const candleStickData = await fetchApiGetCandleStickData(params);
      const { highest, lowest } = findMinMaxPriceCandle(candleStickData);
      const isBreakOutUp = isBreakOut(candleStickData, highest, 5, "up");
      const isBreakOutDown = isBreakOut(candleStickData, lowest, 5, "down");
      if (isBreakOutUp) {
        bot.sendMessage(
          chatId,
          `symbol ${buildLinkToSymbol(
            symbol
          )} đã break out xu hướng LÊN tại khung ${timeLine} !!`,
          { parse_mode: "HTML", disable_web_page_preview: true }
        );
        count += 1;
      } else if (isBreakOutDown) {
        bot.sendMessage(
          chatId,
          `symbol ${buildLinkToSymbol(
            symbol
          )} đã break out xu hướng XUỐNG tại khung ${timeLine} !!`,
          { parse_mode: "HTML", disable_web_page_preview: true }
        );
        count += 1;
      }
      if (index === listSymbols.length - 1 && !count) {
        bot.sendMessage(chatId, `Không tìm thấy symbol nào hiện tại.`);
      }
    });
  }
};
