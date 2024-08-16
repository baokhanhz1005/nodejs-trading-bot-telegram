import {
  buildLinkToSymbol,
  sendCurrentTime,
  timeToSpecificTime,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import {
  findContinueSameTypeCandle,
  getAlertByType,
} from "../../../utils/handleDataCandle.js";
import {
  checkFullCandle,
  isDownCandle,
  isUpCandle,
} from "../../../utils/TypeCandle.js";
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
          limit: 6,
        },
      };
      const { data: candleStickData } = await fetchApiGetCandleStickData(
        params
      );

      if (candleStickData && candleStickData.length) {
        candleStickData.pop();

        const [thirdCandle, previousCandle, latestCandle] =
          candleStickData.slice(-3);
        const { maxContinueDown, maxContinueUp } =
          findContinueSameTypeCandle(candleStickData);
        const limit = 3;
        const isPassCondition = [
          isUpCandle(latestCandle)
            ? isDownCandle(thirdCandle) &&
              checkFullCandle(previousCandle, "up") &&
              isUpCandle(latestCandle) && previousCandle[4] > thirdCandle[1]
            : isUpCandle(thirdCandle) &&
              checkFullCandle(previousCandle, "down") &&
              isDownCandle(latestCandle) && previousCandle[4] < thirdCandle[1],
          // maxContinueDown >= limit || maxContinueUp >= limit,
          // isUpCandle(latestCandle)
          //   ? isDownCandle(previousCandle) &&
          //     checkFullCandle(isUpCandle, "up") &&
          //     latestCandle[4] * 0.997 > previousCandle[1]
          //   : isUpCandle(previousCandle) &&
          //     checkFullCandle(latestCandle, "down") &&
          //     latestCandle[4] * 1.003 < previousCandle[1],
        ].every((cond) => !!cond);

        let type = isUpCandle(latestCandle) ? "up" : "down";

        // type = maxContinueDown >= limit ? "down" : "up";

        if (isPassCondition) {
          const textType = type === "up" ? "TĂNG" : "GIẢM";
          bot.sendMessage(
            chatId,
            `${getAlertByType(type)} Symbol ${buildLinkToSymbol(
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
