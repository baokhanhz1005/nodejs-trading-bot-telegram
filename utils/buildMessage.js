export const buildMessageTPSL = (
  isTakeProfit,
  symbol,
  type,
  tempMapListOrders
) => {
  const textStyle = {
    content: "TAKE PROFIT",
    color: "yellowgreen",
    type: type === "BUY" ? "LONG" : "SHORT",
  };

  const linkUrl = `https://en.tradingview.com/chart/?symbol=BINANCE%3A${symbol}.P`;
  const url = `<a href="${linkUrl}" target="_blank">Open Chart</a>`;

  if (!isTakeProfit) {
    // ===> SL
    textStyle.content = "STOP LOSS";
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

  let content = `Lệnh ${symbol} đã chạm || ${textStyle.content} || vị thế ${textStyle.type} ${moreInfo} - ${url}`;

  return content;
};
