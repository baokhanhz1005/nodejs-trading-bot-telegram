import {
  buildLinkToSymbol,
  calculateMovingAverage,
  calculateRSI,
  calculateStochRSI,
  fetchApiGetCandleStickData,
  fetchApiGetCurrentPositionAccount,
  fetchApiGetCurrentPrice,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import OrderServices from "../../../services/Order.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import TechnicalIndicators from "technicalindicators";
import {
  ForeCastMethod,
  checkTrendLine,
  getListSupportRestricted,
  rateUpAndDown,
} from "../../../utils/handleDataCandle.js";
import { checkAvailableOrderV2 } from "../../execute/ExecuBuySellRestricted/utils.js";
import { checkAbleOrderSMC } from "../../execute/ExecuteSMC/utils.js";
import { COST, REWARD, RR } from "../../execute/ExecuteSMC/constant.js";

export const TestingFunction = async (payload) => {
  try {
    const { bot, chatId, timeLine } = payload;

    const listSymbols = await fetchApiGetListingSymbols();
    let count = 0;

    // let symbol = "MANAUSDT";
    let type = "up";
    let R = 0;
    let totalOrder = 0;
    let totalWin = 0;
    let totalLose = 0;
    let listInfo = [];
    let percentAvg = 0;
    let countSymbol = 0;
    let totalCost = 0;

    if (listSymbols && listSymbols.length) {
      const promiseCandleData = listSymbols.map(async (token) => {
        const { symbol, stickPrice } = token;
        const params = {
          data: {
            symbol: symbol,
            interval: timeLine,
            limit: 1000, // 388 -- 676 -- 964
          },
        };
        const res = await fetchApiGetCandleStickData(params);
        return res;
      });

      Promise.all(promiseCandleData).then((res) => {
        if (res.length) {
          res.forEach((candleInfo) => {
            const { symbol: symbolCandle, data: candleStickData } = candleInfo;

            if (candleStickData && candleStickData.length) {
              const payload = {
                candleStickData,
                method: {
                  methodFn: checkAbleOrderSMC,
                  config: {
                    rangeCandleInfo: 100,
                    symbol: symbolCandle,
                  },
                },
              };
              const {
                countOrders,
                winOrder,
                loseOrder,
                orderInfo,
                info,
                percent,
                count,
                cost,
              } = ForeCastMethod(payload);
              R = R + (winOrder * RR - loseOrder);
              totalWin += winOrder;
              totalLose += loseOrder;
              totalOrder += countOrders;
              totalCost += cost;
              if (count) {
                percentAvg += +percent / +count;
                countSymbol += 1;
              }
              if (info) {
                listInfo.push(info);
              }
            }
          });
          if (true) {
            // Dùng cho việc log ra các lệnh SL, cho việc đánh giá lý do tại sao lệnh chạm SL
            let tempMess = [];
            for (let i = 0; i < listInfo.length; i++) {
              if (i > 16) break;
              if (i % 5 === 0 && i !== 0) {
                tempMess.push(listInfo[i]);
                bot.sendMessage(chatId, `${tempMess.join("")}`, {
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                });
                tempMess = [];
              } else {
                tempMess.push(listInfo[i]);
              }
            }
            if (tempMess.length) {
              bot.sendMessage(chatId, `${tempMess.join("")}`, {
                parse_mode: "HTML",
                disable_web_page_preview: true,
              });
              tempMess = [];
            }
          }
          bot.sendMessage(
            chatId,
            `- Thu được ${R}R \n - Tổng số lệnh: ${totalOrder} với: \n     + ${totalWin} lệnh TP và ${totalLose} lệnh SL \n     + Tỷ lệ: ${(
              (totalWin / totalOrder) *
              100
            ).toFixed(2)}%\n     + Profit: ${(R * REWARD - totalCost).toFixed(
              2
            )}\n     + Cost: ${percentAvg / countSymbol} - ${totalCost}`
          );
        }
      });
    }
  } catch (error) {
    console.error("Error in TestingFunction:", error);
  }
};
