export const buildMessageTPSL = (
  isTakeProfit,
  symbol,
  type,
  tempMapListOrders
) => {
  const textStyle = {
    content: "😍 TP",
    color: "yellowgreen",
    type: type === "SELL" ? "LONG" : "SHORT",
  };

  const linkUrl = `https://en.tradingview.com/chart/?symbol=BINANCE%3A${symbol}.P`;
  const url = `<a href="${linkUrl}" target="_blank">Open Chart</a>`;

  if (!isTakeProfit) {
    // ===> SL
    textStyle.content = "😭 SL";
    textStyle.color = "red";
  }
  let moreInfo = "";
  if (tempMapListOrders[symbol]) {
    const { tp, sl } = tempMapListOrders[symbol];

    if (isTakeProfit) {
      moreInfo += `tại giá ${tp}`;
    } else {
      moreInfo += `tại giá ${sl}`;
    }
  }

  let content = `${textStyle.content} lệnh ${symbol} vị thế ${textStyle.type} ${moreInfo} - ${url}`;

  return content;
};
