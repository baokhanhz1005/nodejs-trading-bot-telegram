import { CONFIG_EXEC_BIG_PRICE } from "../../../constant.js";
import AccountService from "../../../services/Account.js";
import OrderServices from "../../../services/Order.js";
import {
    buildLinkToSymbol,
    calculateTimeout15m,
    fetchApiGetCandleStickData,
    fetchApiGetCurrentPositionAccount,
    fetchApiGetCurrentPrice,
    fetchApiGetListingSymbols,
} from "../../../utils.js";
import { buildMessageTPSL } from "../../../utils/buildMessage.js";
import { checkHasBigPriceTrend } from "../../handlers/TrackingBigPriceTrend/utils.js";
import { OrderMarket } from "../../orders/MarketOrder/index.js";
import { TYPE_MARKET } from "../../orders/contants.js";
import { checkAbleOrderBySympleMethod } from "./utils.js";

export const ExecuteSympleMethod = async (payload) => {
    const { bot, chatId, timeLine } = payload;
    const listSymbols = await fetchApiGetListingSymbols();

    let countTP = 0;
    let countSL = 0;
    const tempMapListOrders = {};
    let listSymbolDeleteRemain = [];
    let listSymbolWithCondition = [];
    const mapLevelPow = {};

    const executeBOT = async () => {
        const timeMinute = new Date().getMinutes();
        const isHasTrackingData = timeMinute % 5 === 0;
        const mapListOrders = {};
        let listSymbolOpenOrder = [];

        if (!isHasTrackingData) {
            try {
                const { data: listOpenOrderData } = await OrderServices.getList({
                    data: {
                        timestamp: Date.now(),
                    },
                });

                // build thành Object
                listOpenOrderData.forEach((order) => {
                    if (order) {
                        mapListOrders[order.symbol] = [
                            ...(mapListOrders[order.symbol] || []),
                            order,
                        ];
                    }
                });

                if (listSymbolDeleteRemain.length) {
                    listSymbolDeleteRemain.forEach(symb => {
                        if (!mapListOrders[symb] || (mapListOrders[symb] && !mapListOrders[symb].length)) {
                            listSymbolDeleteRemain = [...listSymbolDeleteRemain].filter(each => each !== symb);
                        }
                    })
                    bot.sendMessage(chatId, `⚠⚠⚠⚠ ${listSymbolDeleteRemain.join('--')} chưa thể xóa các lệnh này được.`)
                }

                listSymbolOpenOrder = Object.keys(mapListOrders);

                for (const symbol of listSymbolOpenOrder) {
                    if (
                        mapListOrders[symbol].length &&
                        (mapListOrders[symbol].every(
                            (order) => order.type === TYPE_MARKET.STOP_MARKET
                        ) ||
                            mapListOrders[symbol].every(
                                (order) => order.type === TYPE_MARKET.TAKE_PROFIT_MARKET
                            ))
                    ) {
                        // thực thi xóa lệnh tồn đọng do đã TP || SL
                        const listPromiseDelete = mapListOrders[symbol].map(orderDelete => {
                            const { symbol: symbolDelete, orderId: orderIdDelete } =
                                orderDelete;

                            // nếu còn lệnh stop market ==> lệnh tp đã thực thi và ngược lại
                            return OrderServices.delete({
                                data: {
                                    orderId: orderIdDelete,
                                    symbol: symbolDelete,
                                    timestamp: Date.now(),
                                },
                            });
                        });

                        const { type: typeOrder, side } = mapListOrders[symbol][0];
                        const isTakeProfit = typeOrder === TYPE_MARKET.STOP_MARKET;

                        Promise.all(listPromiseDelete).then(res => {
                            // send mess thông báo đã TP/SL lệnh
                            if (isTakeProfit) {
                                countTP += 1;
                                mapLevelPow[symbol] = 0;
                            } else {
                                countSL += 1;
                                if (mapLevelPow[symbol] === 8) {
                                    mapLevelPow[symbol] = 0;
                                } else {
                                    mapLevelPow[symbol] += 1;
                                }
                            }
                            bot.sendMessage(
                                chatId,
                                buildMessageTPSL(isTakeProfit, symbol, side, tempMapListOrders),
                                {
                                    parse_mode: "HTML",
                                    disable_web_page_preview: true,
                                }
                            );

                            delete mapListOrders[symbol];
                            delete tempMapListOrders[symbol];

                        }).catch(err => {
                            console.error(err);
                            bot.sendMessage(
                                chatId,
                                `⚠⚠⚠⚠ ${symbol} -- tôi không thể xóa lệnh tồn đọng này, vui lòng gỡ lệnh này giúp tôi.`
                            );
                            listSymbolDeleteRemain.push(symbol);
                        })
                    }
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            if (listSymbols && listSymbols.length) {
                let listSymbolGetCandle = listSymbolWithCondition;
                if (!listSymbolWithCondition.length) {
                    listSymbolGetCandle = listSymbols;
                }
                const promistCandleData = listSymbolGetCandle.map(async (token) => {
                    const { symbol, stickPrice } = token;
                    const params = {
                        data: {
                            symbol: symbol,
                            interval: timeLine,
                            limit: 100,
                        },
                    };
                    return fetchApiGetCandleStickData(params);
                })


                Promise.all(promistCandleData).then(res => {
                    const temListSymbol = [];
                    if (res.length) {
                        res.forEach(candleInfo => {
                            const { symbol: symbolCandle, data: candleStickData } = candleInfo;
                            candleStickData.pop();
                            const {
                                isAbleOrder,
                                type,
                                tpPercent,
                                slPercent,
                                timeStamp = "",
                            } = checkAbleOrderBySympleMethod(candleStickData, symbolCandle) || {};

                            const lastestCandlePrice = candleStickData.slice(-1)[0][4];
                            if (lastestCandlePrice <= 0.1 && !listSymbolWithCondition.length) {
                                const symbolInfo = listSymbols.find(each => each.symbol === symbolCandle);
                                temListSymbol.push(symbolInfo);
                            };

                            const isHasOrderRunning = Object.keys(tempMapListOrders).some(key => key === symbolCandle);

                            if (isAbleOrder && !isHasOrderRunning && (listSymbolWithCondition.length ? true : lastestCandlePrice <= 0.1)) {
                                const { stickPrice } = listSymbols.find(each => each.symbol === symbolCandle) || {};
                                handleOrder({
                                    symbol: symbolCandle,
                                    type,
                                    tpPercent,
                                    slPercent,
                                    stickPrice,
                                    levelPow: mapLevelPow[symbolCandle] || 0,
                                })

                                if (!mapLevelPow[symbolCandle]) {
                                    mapLevelPow[symbolCandle] = 0;
                                }
                            };
                        })

                        if (!listSymbolWithCondition.length) {
                            listSymbolWithCondition = temListSymbol;
                        }
                    }
                }).catch(err => {
                    console.error('Some thing went wrong while get candle stick data', err);
                })
            }

            // Noti tài khoản hiện tại
            const resAccount = await AccountService.info({
                data: {
                    timestamp: Date.now(),
                },
            });
            const { totalWalletBalance: accountBalance } = resAccount.data;
            bot.sendMessage(
                chatId,
                `- Tài khoản hiện tại của bạn là: ${+accountBalance}\n- Có ${countTP} lệnh đạt TP    -    ${countSL} lệnh chạm SL\n- Hiện tại có ${Object.keys(tempMapListOrders).length} lệnh đang chạy...<${listSymbolWithCondition.length}>`
            );
        }

    };

    const handleOrder = async (payload) => {
        try {
            const { symbol, type, tpPercent, slPercent, stickPrice, levelPow } = payload;
            const data = await fetchApiGetCurrentPrice({
                symbol,
            });
            const { price } = data;
            if (price) {
                await OrderMarket({
                    symbol,
                    entry: +price,
                    type,
                    stickPrice,
                    tp: tpPercent,
                    sl: slPercent,
                    levelPow
                });

                const ratePriceTP =
                    type === "up"
                        ? 1 + tpPercent / 100
                        : 1 - tpPercent / 100;
                const ratePriceSL =
                    type === "up"
                        ? 1 - slPercent / 100
                        : 1 + slPercent / 100;

                const newOrder = {
                    symbol,
                    entry: +price,
                    tp: ratePriceTP * price,
                    sl: ratePriceSL * price,
                    type,
                    levelPow,
                };
                tempMapListOrders[symbol] = newOrder;

                bot.sendMessage(
                    chatId,
                    `Thực hiện lệnh ${type === "up" ? "LONG" : "SHORT"
                    } ${symbol}  tại giá ${price} \n - Open chart: ${buildLinkToSymbol(
                        symbol
                    )} - L${levelPow}`,
                    { parse_mode: "HTML", disable_web_page_preview: true }
                );

            }
        } catch (error) {
            console.error('Something went wrong...', error);
        }
    };

    setTimeout(() => {
        executeBOT();
        setInterval(() => {
            executeBOT();
        }, 1 * 60 * 1000);
    }, 0);
};
