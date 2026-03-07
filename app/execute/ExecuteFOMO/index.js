import {
  buildLinkToSymbol,
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
  let filteredListSymbols = [];
  const candleCache = {};

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

  const mergeCandles = (oldCandles = [], newCandles = []) => {
    const map = new Map();

    [...oldCandles, ...newCandles].forEach((c) => {
      map.set(c[0], c);
    });

    const merged = Array.from(map.values()).sort((a, b) => a[0] - b[0]);

    return merged.slice(-200);
  };

  const executeBOT = async () => {
    const timeMinute = new Date().getMinutes();
    const isHasTrackingData = true || timeMinute % 15 === 0; // use candle 15m
    const tempListSymbols = [];

    if (isHasTrackingData) {
      // bot.sendMessage(chatId, "🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯");
      const promiseDataCandles = shuffleArr(
        filteredListSymbols.length ? filteredListSymbols : listSymbols,
      )
        .map((tokenInfo) => {
          const { symbol, stickPrice } = tokenInfo;
          const params = {
            data: {
              symbol: symbol,
              interval: timeLine,
              limit: !filteredListSymbols.length
                ? 3
                : !candleCache[symbol]
                  ? 201
                  : 3,
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
            const { symbol: symbolCandle, data: candles = [] } = response;
            if (!candles.length) continue;
            // console.log(symbolCandle, candles.length);
            const newestCandle = candles.slice(-1)[0];
            const dateTimeCandle = new Date(newestCandle[0]);
            const currentTime = new Date();
            if (
              Number(dateTimeCandle.getMinutes()) ===
              Number(currentTime.getMinutes())
            ) {
              candles.pop();
            }

            if (filteredListSymbols.length) {
              if (!candleCache[symbolCandle]) {
                // lần đầu load 200 nến
                candleCache[symbolCandle] = candles.slice(-200);
              } else {
                // merge nến mới
                candleCache[symbolCandle] = mergeCandles(
                  candleCache[symbolCandle],
                  candles,
                );
              }
            }

            const candleStickData = filteredListSymbols.length
              ? candleCache[symbolCandle]
              : candles;

            const [prevCandle, lastestCandle] = candleStickData.slice(-2);

            if (validatePriceForTrade(+candleStickData.slice(-1)[0][4])) {
              tempListSymbols.push({ symbol: symbolCandle });
            }

            if (candleStickData.length < 200) continue;

            const {
              type,
              symbol,
              isAbleOrder,
              tpPercent,
              slPercent,
              timeStamp,
            } = checkAbleQuickOrder(candleStickData, symbolCandle);

            if (
              isAbleOrder &&
              validatePriceForTrade(+candleStickData.slice(-1)[0][4])
            ) {
              const ratePriceSL =
                type === "up" ? 1 - slPercent / 100 : 1 + slPercent / 100;

              const message = `${
                type === "up" ? "🟢🟢" : "🔴🔴"
              } ${buildLinkToSymbol(symbolCandle)} ${
                type === "up" ? "BULL" : "BEAR"
              } SIGNAL \nPer: ${+slPercent.toFixed(2)}%\nBasic entry: ${lastestCandle[4]}\nEst SL: ${lastestCandle[4] * ratePriceSL}`;

              bot.sendMessage(chatId, message, {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: `order ${symbolCandle} ${
                          lastestCandle[4] * ratePriceSL
                        } ${type} ${COST}`,
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
          }
        }

        // update list by condition
        if (!filteredListSymbols.length) {
          filteredListSymbols = tempListSymbols;
        }
      });

      // const mapListOrders = {};

      // await fetchApiHandleResultOrder(
      //   payload,
      //   mapListOrders,
      //   listSymbolDeleteRemain,
      //   Date.now(),
      // );
    } else {
      // if ((timeMinute - 1) % 5 === 0) {
      //   BackTestFOMO({ ...payload, typeCheck: 1, isCheckWinRate: true });
      // } else if ((timeMinute - 2) % 5 === 0) {
      //   BackTestFOMO({ ...payload, typeCheck: 2, isCheckWinRate: true });
      // }
    }
  };

  setTimeout(
    () => {
      executeBOT();
      setInterval(
        () => {
          executeBOT();
        },
        1 * 60 * 1000,
      );
    },
    timeRemaining * 1000 + 500,
  );
};
