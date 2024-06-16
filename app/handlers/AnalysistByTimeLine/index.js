import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { shuffleArr } from "../../../utils/handleDataCandle.js";
import { checkIsAbleOrder } from "./utils.js";

export const AnalysisByTimeLine = async (payload) => {
  const { chatId, timeLine, bot } = payload;
  let countOrder = 0;
  try {
    const listSymbols = await fetchApiGetListingSymbols();

    if (listSymbols && listSymbols.length) {
      const listPromiseDataCandle = listSymbols.map(async (token) => {
        const { symbol, stickPrice } = token;
        const params = {
          data: {
            symbol,
            interval: timeLine,
            limit: 100,
          },
        };
        return fetchApiGetCandleStickData(params);
      });

      await Promise.allSettled(listPromiseDataCandle).then((result) => {
        result.forEach((handle) => {
          if (
            handle.status === "fulfilled" &&
            handle.value &&
            typeof handle.value === "object" &&
            Object.keys(handle.value).length
          ) {
            const { symbol: symbolCandle, data: candleStickData } =
              handle.value;

              candleStickData.pop();

            const lastestCandle = candleStickData.slice(-1)[0];
            const { isAbleOrder, type } = checkIsAbleOrder(candleStickData);

            if (isAbleOrder && lastestCandle[4] < 5) {
                countOrder += 1;
              bot.sendMessage(
                chatId,
                `${
                  type === "up" ? "🟢🟢🟢🟢" : "🔴🔴🔴🔴"
                } - symbol ${buildLinkToSymbol(symbolCandle)} có thể cân nhắc ${
                  type === "up" ? "LONG" : "SHORT"
                }`,
                { parse_mode: "HTML", disable_web_page_preview: true }
              );
            }

          } else {
            console.error(
              `Failed to fetch candle data for symbol: ${handle.reason}`
            );
          }
        });
      });

      if (!countOrder) {
        bot.sendMessage(chatId, 'Không tìm thấy lệnh nào...')
      }
    }
  } catch (error) {}
};
