import fs from "fs/promises";
import path from "path";
import util from "util";
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
import { checkAbleOrderBySympleMethod } from "../../execute/ExecuteSympleMethod/utils.js";
import { isCheckCandleHistory, isOtherMethod } from "./constants.js";

export const TestingFunction = async (payload) => {
  try {
    const { bot, chatId, timeLine } = payload;

    const fileName = "DATA_CANDLE.json";
    const filePath = path.join("./", fileName);
    let dataCandle;
    try {
      if (isCheckCandleHistory) {
        const dataStoraged = await fs.readFile(filePath, "utf-8");
        if (dataStoraged) {
          dataCandle = JSON.parse(dataStoraged);
        }
      }
      console.log("Get from try");
    } catch (e) {
      console.log("Get from catch");
      dataCandle = null;
    }

    const writeFile = util.promisify(fs.writeFile);

    const writeToDisk = async (dataCandle) => {
      try {
        await writeFile(filePath, JSON.stringify(dataCandle, null, 2));
        console.log("Write to file successful!");
      } catch (error) {
        console.error("Error writing to file:", error);
      }
    };

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
    let totalLong = 0;
    let totalShort = 0;
    // other method
    let profitMethod = 0;
    let levelPowMethod = 0;
    let isLoseFullPowMethod = false;
    let countLoseFullMethod = 0;
    let stringSymbol = "";
    let countLevelHigh = 0;
    const mapMaxLevelPow1 = {};
    const mapMaxLevelPow2 = {};
    if (listSymbols && listSymbols.length) {
      const promiseCandleData = dataCandle
        ? dataCandle
        : listSymbols
            .filter((each) => each.symbol !== "RSRUSDT")
            .map(async (token) => {
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

      Promise.all(promiseCandleData).then(async (res) => {
        if (res.length) {
          if (!dataCandle && isCheckCandleHistory) {
            await writeToDisk(res);
          }
          res.forEach((candleInfo, index) => {
            const { symbol: symbolCandle, data: candleStickData } = candleInfo;

            if (
              candleStickData &&
              candleStickData.length &&
              (false || candleStickData.slice(-1)[0][4] < 0.1)
            ) {
              const payload = {
                candleStickData: candleStickData || candleStickData.slice(-388),
                method: {
                  methodFn: checkAbleOrderBySympleMethod,
                  // checkAbleOrderSMC,
                  config: {
                    rangeCandleInfo: 100,
                    symbol: symbolCandle,
                  },
                },
                isOtherMethod,
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
                countLong,
                countShort,
                // other method
                isLoseFullPow,
                levelPow,
                profit,
                maxLevelPow,
              } = ForeCastMethod(payload);
              R = R + (winOrder * RR - loseOrder);
              totalWin += winOrder;
              totalLose += loseOrder;
              totalOrder += countOrders;
              totalCost += cost;
              totalLong += countLong;
              totalShort += countShort;
              //other method
              profitMethod += profit;
              levelPowMethod = levelPow;
              if (isLoseFullPow) {
                countLoseFullMethod += 1;
                stringSymbol += `${symbolCandle} `;
              }
              if (levelPow >= 5) {
                countLevelHigh += 1;
              }
              if (maxLevelPow > 0) {
                mapMaxLevelPow1[maxLevelPow] =
                  mapMaxLevelPow1[maxLevelPow] !== undefined
                    ? mapMaxLevelPow1[maxLevelPow] + 1
                    : 1;
              }
              if (maxLevelPow > 0 && levelPow < maxLevelPow) {
                mapMaxLevelPow2[maxLevelPow] =
                  mapMaxLevelPow2[maxLevelPow] !== undefined
                    ? mapMaxLevelPow2[maxLevelPow] + 1
                    : 1;
              }
              if (count) {
                percentAvg += +percent / +count;
                countSymbol += 1;
              }
              if (info && info.length) {
                listInfo.push(...info);
              }
            }
          });
          if (false) {
            // Dùng cho việc log ra các lệnh SL\TP, cho việc đánh giá lý do tại sao lệnh chạm SL
            let tempMess = [];
            for (let i = 0; i < listInfo.length; i++) {
              if (i > 20) break;
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
          if (isOtherMethod) {
            bot.sendMessage(
              chatId,
              `- Tổng số lệnh: ${totalOrder} với: \n- Thu được: ${profitMethod}$ 
              \n- Số lệnh mắc lose liên tiếp: ${countLoseFullMethod} - LEVEL: ${countLevelHigh}\n ${stringSymbol}\n+ ${totalWin} lệnh TP và ${totalLose} lệnh SL
              \n ${Object.keys(mapMaxLevelPow1)
                .map((key) => `** L${key}: ${mapMaxLevelPow1[key]}`)
                .join("\n")}
              \n =========================
              \n ${Object.keys(mapMaxLevelPow2)
                .map((key) => `** L${key}: ${mapMaxLevelPow2[key]}`)
                .join("\n")} 
              `
            );
          } else {
            bot.sendMessage(
              chatId,
              `- Thu được ${R}R \n c     + ${totalWin} lệnh TP và ${totalLose} lệnh SL \n     + Tỷ lệ: ${(
                (totalWin / totalOrder) *
                100
              ).toFixed(2)}%\n     + Profit: ${(R * REWARD - totalCost).toFixed(
                2
              )}\n     + Cost: ${
                percentAvg / countSymbol
              } - ${totalCost}\n     + Gồm: ${totalLong} LONG và ${totalShort} SHORT`
            );
          }
        }
      });
    }
  } catch (error) {
    console.error("Error in TestingFunction:", error);
  }
};
