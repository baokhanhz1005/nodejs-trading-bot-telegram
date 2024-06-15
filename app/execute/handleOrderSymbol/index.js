import { OrderMarket } from "../../orders/MarketOrder";

export const handleOrderSymbol = async (payload) => {
  const { bot, chatId, timeLine, command } = payload;
  // ex: order ABCUSDT 1 2% up

  const listSymbols = await fetchApiGetListingSymbols();
  const arrayCommand = command.split(" ");

  const tokenInfo = listSymbols.find(
    (token) => token.symbol === arrayCommand[1]
  );
  if (tokenInfo) {
    const { symbol, stickPrice } = tokenInfo;

    const { price } = await fetchApiGetCurrentPrice({
      symbol: arrayCommand[1],
    });

    const volumeOrder = (arrayCommand[2] * 100) / sl;

    const orderInfo = {
      symbol,
      entry: price,
      stickPrice,
      tp: arrayCommand[3] * 1.4,
      sl: arrayCommand[3],
      volumeOrder,
      type: arrayCommand[4],
    };

    await OrderMarket(orderInfo);

    bot.sendMessage(
      chatId,
      `Đã order lệnh ${symbol} - ${orderInfo.type} \n- price: ${arrayCommand[2]}`
    );
  } else {
    bot.sendMessage(
      chatId,
      `Lệnh Order với cú pháp:\n- ex: Order ABCUSDT 1$ 2% up`
    );
  }
};
