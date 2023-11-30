import {
  buildLinkToSymbol,
  fetchApiGetCandleStickData,
  fetchApiGetListingSymbols,
} from "../../../utils.js";
import { RSI, MACD, ADX } from "technicalindicators";

const configSettings = {
  buyIndex: 30,
  sellIndex: 70,
};

export const IndicatorTechnical = async (payload) => {
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
      const candleStickData = await fetchApiGetCandleStickData(params);

      if (candleStickData && candleStickData.length) {
        const closePrice = candleStickData.map((candle) => candle[4]);
        const rsi = RSI.calculate({ values: closePrice, period: 14 });
        const macd = MACD.calculate({
          values: closePrice,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        });
        const adx = ADX.calculate({
          close: closePrice,
          high: candleStickData.map((candle) => candle[2]),
          low: candleStickData.map((candle) => candle[3]),
          period: 14,
        });
        const lastIndex = 0;
        // console.log(rsi[lastIndex], macd[lastIndex].signal, adx[lastIndex].adx)
        // console.log(closePrice.length, rsi.length, macd.length, adx.length);
        if (
          rsi[lastIndex] < configSettings.buyIndex &&
          macd[lastIndex].signal > 0 &&
          adx[lastIndex].adx > 25   
        ) {
          bot.sendMessage(
            chatId,
            `${buildLinkToSymbol(symbol)} có vùng BUY tốt - RSI: ${
              rsi[lastIndex]
            }, MACD: ${macd[lastIndex].histogram}, ADX: ${adx[lastIndex].adx}`
          );
        } else if (
          rsi[lastIndex] > configSettings.sellIndex &&
          macd[lastIndex].signal < 0 &&
          adx[lastIndex].adx > 25
        ) {
          bot.sendMessage(
            chatId,
            `${buildLinkToSymbol(symbol)} có vùng SELL tốt - RSI: ${
              rsi[lastIndex]
            }, MACD: ${macd[lastIndex].histogram}, ADX: ${adx[lastIndex].adx}`
          );
        }
      }
      if (index === listSymbols.length - 1 && !count) {
        bot.sendMessage(chatId, `Không tìm thấy symbol nào hiện tại.`);
      }
    });
  }
};
