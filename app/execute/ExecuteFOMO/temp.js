// const COND_1 = EstRR > 1 && EstRR < 2;
// const COND_2 = !rangeCandle50.some(
//   (candle) => isDownCandle(candle) && candle[1] / candle[4] >= 1.015
// );
// const COND_3 = maxRange50 / lastestCandle[4] >= 1.02;

// const COND_4 = maxContinueDown <= 4;

// const COND_5 =
//   // lastestCandle[4] / minRange15 <= 1.01
//   // ||
//   (lastestCandle[4] / minRange15 - 1) /
//     (lastestCandle[4] / lastestCandle[1] - 1) <=
//   2.5;

// const COND_6 =
//   candleStickData.slice(-6).reduce((acc, candle) => {
//     if (isDownCandle(candle)) {
//       return acc + 1;
//     }

//     return acc;
//   }, 0) < 4;

// const COND_7 =
//   (getMaxOnListCandle(candleStickData.slice(-20), 4) / lastestCandle[4] - 1) /
//     (lastestCandle[4] / lastestCandle[1] - 1) <=
//   4;

// const COND_8 =
//   (maxRange75 / lastestCandle[4] - 1) /
//     (lastestCandle[4] / lastestCandle[1] - 1) <=
//   10;

// const COND_9 =
//   (maxRange50 / lastestCandle[4] - 1) /
//     (lastestCandle[4] / lastestCandle[1] - 1) <=
//   8;

// const COND_10 =
//   (maxRange50 / minRange50 - 1) / (lastestCandle[4] / lastestCandle[1] - 1) < 5;

// const COND_11 =
//   (maxRange150 / minRange150 - 1) / (lastestCandle[4] / lastestCandle[1] - 1) <=
//   15;

// const COND_12 =
//   (maxRange150 / lastestCandle[4] - 1) /
//     (lastestCandle[4] / lastestCandle[1] - 1) >=
//   4;

// //////////// shorrt

// const COND_1 = EstRR > 1 && EstRR < 2;
// const COND_2 = !rangeCandle50.some(
//   (candle) => isUpCandle(candle) && candle[4] / candle[1] >= 1.015
// );
// const COND_3 = maxContinueUp <= 4;
// const COND_4 =
//   (maxRange50 / lastestCandle[4] - 1) /
//     (lastestCandle[1] / lastestCandle[4] - 1) <=
//   6;
// // maxRange50 / lastestCandle[4] <= 1.02;
// const COND_5 = (() => {
//   const maxExChangeUp = rangeCandle75.reduce((acc, candle, index) => {
//     if (isUpCandle(candle) && candle[4] - candle[1] > acc) {
//       return candle[4] - candle[1];
//     }

//     return acc;
//   }, 0);

//   const maxExchangeDown = rangeCandle75.reduce((acc, candle, index) => {
//     if (isDownCandle(candle) && candle[1] - candle[4] > acc) {
//       return candle[1] - candle[4];
//     }

//     return acc;
//   }, 0);

//   if (maxExChangeUp && maxExchangeDown) {
//     return maxExChangeUp / maxExchangeDown < 1.2;
//   }
//   return false;
// })();

// const COND_6 =
//   getMaxOnListCandle(rangeCandle75, 4) / getMinOnListCandle(rangeCandle75, 4) >=
//   1.02;

// const COND_7 =
//   (getMaxOnListCandle(candleStickData, 4) / lastestCandle[4] - 1) /
//     (lastestCandle[1] / lastestCandle[4] - 1) <=
//   10;

// const COND_8 =
//   (maxRange75 - minRange75) / (lastestCandle[1] - lastestCandle[4]) >= 7;

// const COND_9 =
//   (lastestCandle[4] / getMinOnListCandle(candleStickData.slice(-75), 4) - 1) /
//     (lastestCandle[1] / lastestCandle[4] - 1) <=
//   14;

// const COND_10 =
//   (lastestCandle[4] / minRange50 - 1) /
//     (lastestCandle[1] / lastestCandle[4] - 1) >=
//   3;
