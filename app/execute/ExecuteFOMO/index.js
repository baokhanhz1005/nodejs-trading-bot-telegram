import {
  buildLinkToSymbol,
  buildTimeStampToDate,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
  fetchApiHandleResultOrder,
} from "../../../utils.js";
import {
  shuffleArr,
  validatePriceForTrade,
} from "../../../utils/handleDataCandle.js";
import { isDownCandle, isUpCandle } from "../../../utils/TypeCandle.js";
import { BackTestFOMO } from "./backtest.js";
import { CONFIG_QUICK_TRADE } from "./config.js";
import { checkAbleQuickOrder } from "./utils.js";

const { COST } = CONFIG_QUICK_TRADE;

export const ExecuteFOMO = async (payload) => {
  const { bot, chatId, timeLine } = payload;
  const listSymbols = await fetchApiGetListingSymbols();
  const listSymbolDeleteRemain = [];
  const currentSecond = new Date().getSeconds();
  const timeRemaining = 60 - currentSecond;
  const mapPreOrder = {};

  bot.on("message", async (msg) => {
    const botId = (await bot.getMe()).id;
    if (msg.from && msg.from.id === botId) {
      console.log(msg);
      const contentToPin = ["😍😍 TP", "😭😭 SL"];
      if (contentToPin.some((keyword) => msg.text?.includes(keyword))) {
        try {
          await bot.pinChatMessage(chatId, msg.message_id);
        } catch (error) {
          console.error(error);
        }
      }
    }
  });

  const executeBOT = async () => {
    const timeMinute = new Date().getMinutes();
    const isHasTrackingData = timeMinute % 5 === 0; // use candle 5m

    if (isHasTrackingData) {
      bot.sendMessage(chatId, "🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯");
      const promiseDataCandles = shuffleArr(listSymbols)
        .map((tokenInfo) => {
          const { symbol, stickPrice } = tokenInfo;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: 150,
            },
          };

          if (symbol == "BTCSTUSDT") {
            return null;
          }

          return fetchApiGetCandleStickData(params);
        })
        .filter(Boolean);

      Promise.all(promiseDataCandles).then(async (responses) => {
        if (responses && responses.length) {
          for (const response of responses) {
            const { symbol: symbolCandle, data: candleStickData = [] } =
              response;

            const newestCandle = candleStickData.slice(-1)[0];
            const dateTimeCandle = newestCandle && new Date(newestCandle[0]);
            const currentTime = new Date();
            if (
              dateTimeCandle &&
              Number(dateTimeCandle.getMinutes()) ===
                Number(currentTime.getMinutes())
            ) {
              candleStickData.pop();
            }

            const [prevCandle, lastestCandle] = candleStickData.slice(-2);

            const orderInfo = mapPreOrder[symbolCandle];

            if (orderInfo) {
              const { count, avgPrice, timeStamp, slPercent, type, entry, tp } =
                orderInfo;

              switch (type) {
                case "up":
                case "down": {
                  if (
                    (type === "up" && lastestCandle[3] <= avgPrice) ||
                    (type === "down" && lastestCandle[2] >= avgPrice)
                  ) {
                    // handle send order

                    const ratePriceSL =
                      type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

                    const message = `${buildTimeStampToDate(timeStamp)}\n${
                      type === "up" ? "🟢🟢" : "🔴🔴"
                    } ${buildLinkToSymbol(symbolCandle)} ${
                      type === "up" ? "BULL" : "BEAR"
                    } SIGNAL ${slPercent}%`;

                    bot.sendMessage(chatId, message, {
                      reply_markup: {
                        inline_keyboard: [
                          [
                            {
                              text: `order ${symbolCandle} ${
                                entry * ratePriceSL
                              } ${type} ${COST}`,
                              callback_data: `order ${symbolCandle} ${
                                entry * ratePriceSL
                              } ${type} ${COST}`,
                            },
                          ],
                        ],
                      },
                      parse_mode: "HTML",
                      disable_web_page_preview: true,
                    });

                    delete mapPreOrder[symbolCandle];
                  } else if (
                    (type === "up" && lastestCandle[2] >= tp) ||
                    (type === "down" && lastestCandle[3] <= tp)
                  ) {
                    delete mapPreOrder[symbolCandle];
                  } else if (count < 30) {
                    mapPreOrder[symbolCandle].count += 1;
                  } else {
                    delete mapPreOrder[symbolCandle];
                  }

                  break;
                }

                default:
                  break;
              }
            } else {
              const {
                type,
                symbol,
                isAbleOrder,
                tpPercent,
                slPercent,
                timeStamp,
                entry
              } = checkAbleQuickOrder(candleStickData, symbolCandle);

              if (
                isAbleOrder &&
                lastestCandle[4] <= 5 &&
                validatePriceForTrade(+candleStickData.slice(-1)[0][4])
              ) {
                const ratePriceSL =
                  type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;
    
                const message = `${
                  type === "up" ? "🟢🟢" : "🔴🔴"
                } ${buildLinkToSymbol(symbolCandle)} ${
                  type === "up" ? "BULL" : "BEAR"
                } SIGNAL ${slPercent}%`;
    
                bot.sendMessage(chatId, message, {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: `order ${symbolCandle} ${
                            lastestCandle[4] * ratePriceSL
                          } ${type} ${COST} --- entry: ${entry}`,
                          callback_data: `order ${symbolCandle} ${
                            lastestCandle[4] * ratePriceSL
                          } ${type} ${COST}`,
                        },
                      ],
                    ],
                  },
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                });
              }

              // if (
              //   isAbleOrder &&
              //   lastestCandle[4] <= 5 &&
              //   validatePriceForTrade(+candleStickData.slice(-1)[0][4])
              // ) {
              //   const ratePriceTP =
              //     type === "up" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
              //   const ratePriceSL =
              //     type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

              //   const entry = +lastestCandle[4];
              //   const sl = ratePriceSL * entry;

              //   const newPreOrder = {
              //     count: 0,
              //     avgPrice:
              //       entry +
              //       (type === "up" ? (sl - entry) * 0.3 : (sl - entry) * 0.3),
              //     timeStamp: +timeStamp + 7 * 60 * 60 * 1000,
              //     sl,
              //     tp: entry * ratePriceTP,
              //     type,
              //     entry,
              //     slPercent,
              //   };

              //   mapPreOrder[symbolCandle] = newPreOrder;
              // }
            }
          }
        }
      });
    } else {
      const mapListOrders = {};

      await fetchApiHandleResultOrder(
        payload,
        mapListOrders,
        listSymbolDeleteRemain,
        Date.now()
      );

      if ((timeMinute - 1) % 5 === 0) {
        BackTestFOMO({ ...payload, typeCheck: 1, isCheckWinRate: true });
      } else if ((timeMinute - 2) % 5 === 0) {
        BackTestFOMO({ ...payload, typeCheck: 2, isCheckWinRate: true });
      }
      //  else if ((timeMinute - 3) % 5 === 0) {
      //   BackTestFOMO({ ...payload, isCheckWinRate: true });
      // }
    }
  };

  setTimeout(() => {
    executeBOT();
    setInterval(() => {
      executeBOT();
    }, 1 * 60 * 1000);
  }, timeRemaining * 1000 + 500);
};
