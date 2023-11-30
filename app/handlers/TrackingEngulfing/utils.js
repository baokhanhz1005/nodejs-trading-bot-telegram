export const checkExchangeBigPrice = (candle1, candle2) => {
  let result = {
    isHasExchangeBigPrice: false,
    type: "",
  };

  if (candle1 && candle2) {
    // Kiểm tra nếu cây độ thay đổi price của cây nến sau lớn hơn cây nến trước đó thì mới kiểm tra function này
    const isAllowCheck = 
      Math.abs(candle1[1] - candle1[4]) - Math.abs(candle2[1] - candle2[4]) > 0;
  
    if (isAllowCheck) {
      const isLastestInCreaseCandle = candle1[4] - candle1[1] > 0;
      if (isLastestInCreaseCandle) { // nến sau cùng là nến tăng
        const isPreviousDecreaseCandle = candle2[1] - candle2[4] > 0;
        if (isPreviousDecreaseCandle) {
          result.isHasExchangeBigPrice = candle1[4] > candle2[4];
          result.type = "up";
        } else {
          result.isHasExchangeBigPrice = false;
          result.type = "up";
        }
      } else { // nến sau cùng là nến giảm
        const isPreviousIncreaseCandle = candle2[1] - candle2[4] < 0;
        if (isPreviousIncreaseCandle) {
          result.isHasExchangeBigPrice = candle1[4] < candle2[4];
          result.type = "down";
        } else {
          result.isHasExchangeBigPrice = false;
          result.type = "down";
        }
      }
    }
  }

  return result;
};

export const isMarubozu = (candleData, type) => {
  if (type === "up") {
    return candleData[4] > 0.998 * candleData[2];
  } else {
    return candleData[4] < 1.002 * candleData[3];
  }
};
