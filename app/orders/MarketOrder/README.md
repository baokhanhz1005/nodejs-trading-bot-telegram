\*\* API refer : https://binance-docs.github.io/apidocs/futures/en/#new-order-trade

params = {
    symbol : BTCUSDT,
    side: 'BUY', - BUY // SELL
    type: 'MARKET',
    quantity: 1000 / 30000,  - ví dụ tôi có 1000$ và BTC đang có giá 30000$ vậy quantity là 1000 / 30000
    leverage: 50,   - đòn bẩy
    stopPrice: 27000, - SL: cắt lỏ
    closePosition: false, - Đóng all vị thế
    callbackRate: 1,
    activationPrice: 33000,  - TP: chốt lời
}
