import {
    checkFullCandle,
    checkPinbar,
    isDownCandle,
    isUpCandle,
} from "../../../utils/TypeCandle.js";
import {
    checkCurrentTrending,
    findContinueSameTypeCandle,
    forecastTrending,
    getMaxOnListCandle,
    getMinOnListCandle,
    rateUpAndDown,
} from "../../../utils/handleDataCandle.js";
import { REWARD, RR, LIMIT_ORDER } from "../ExecuteSMC/constant.js";
import { MACD } from 'technicalindicators';

export const checkAbleOrderBySympleMethod = (candleStickData, symbol) => {
    const result = {
        type: "",
        symbol,
        isAbleOrder: false,
        tpPercent: 1,
        slPercent: 1,
        timeStamp: null,
    };

    const newData = { ...result };

    const { type, isAllowOrder, slPercent, timeStamp } = checkPattern(
        candleStickData,
        symbol
    );

    if (isAllowOrder) {
        newData.type = type;
        newData.symbol = symbol;
        newData.isAbleOrder = true;
        newData.slPercent = slPercent;
        newData.tpPercent = slPercent * RR;
        newData.timeStamp = timeStamp;
    }
    return newData;
};

const checkPattern = (candleStickData, symbol) => {
    const count = candleStickData.length;
    const [forthLastCandle, thirdLastCandle, prevCandle, lastestCandle] =
        candleStickData.slice(-4);
    const max = Math.max(
        ...candleStickData.slice(-50).map((candle) => parseFloat(candle[2]))
    );
    const min = Math.min(
        ...candleStickData.slice(-50).map((candle) => parseFloat(candle[3]))
    );

    let type = "";
    let isAllowOrder = false;
    let slPercent = 1;
    let timeStamp = "";

    if (
        candleStickData &&
        candleStickData.length &&
        candleStickData.slice(-50).some((candle) => candle[2] / candle[3] > 1.05)
    ) {
        return { type, slPercent, isAllowOrder };
    }

    // trending 
    const closePrices = candleStickData.map(candle => parseFloat(candle[4]));

    // Tính toán chỉ báo MACD
    const macdInput = {
        values: closePrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    };


    const macdResult = MACD.calculate(macdInput);
    // Lấy giá trị MACD line, Signal line và Histogram
    const macdLine = macdResult.map(result => result.MACD);
    const signalLine = macdResult.map(result => result.signal);
    const histogram = macdResult.map(result => result.histogram);

    // Xác định xu hướng dựa trên MACD và Signal line
    const lastMacd = macdLine[macdLine.length - 1];
    const lastSignal = signalLine[signalLine.length - 1];

    let trend;
    if (true && lastMacd > lastSignal) {
        trend = 'Trending Up';
        const rangeCandle50 = candleStickData.slice(-50);
        const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
        const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);

        const min4Range15 = getMinOnListCandle(candleStickData.slice(-15), 4);
        const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
            candleStickData.slice(-25)
        );
        if (true && (checkFullCandle(lastestCandle, "down") || checkPinbar(lastestCandle, "down"))) {
            const index = candleStickData.slice(-15).findIndex(candle => +candle[4] === +min4Range15);
            if (index < 10) {
                const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.8;
                const CONDITION_1__ = min4Range15 < lastestCandle[4] * 0.994;
                const CONDITION_2__ = EstRR > 1 && EstRR < 2;
                if (CONDITION_1__ && CONDITION_2__) {
                    slPercent = EstRR;
                    type = "down";
                    isAllowOrder = true;
                    timeStamp = lastestCandle[0];
                }
            }
        }

        if (
            false &&
            isDownCandle(lastestCandle)
        ) {
            const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
                candleStickData.slice(-25)
            );
            if (true && maxRange50 * 0.999 < lastestCandle[2]) {
                const EstRR = (maxRange50 / lastestCandle[4] - 1) * 100 * 1.25;
                const CONDITION_6__ = maxContinueUp < 6;
                const CONDITION_8__ = EstRR > 0.8 && EstRR < 2;

                if (CONDITION_6__ && CONDITION_8__) {
                    slPercent = EstRR;
                    type = "down";
                    isAllowOrder = true;
                    timeStamp = lastestCandle[0];
                }
            }
        } else if (false && (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up")) && maxRange45 * 1.004 < lastestCandle[4]) {
            const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1;
            const CONDITION_2__ = EstRR > 1.5;
            if (CONDITION_2__) {
                slPercent = EstRR;
                type = "up";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        }

    } else if (true && lastMacd < lastSignal) {
        trend = 'Trending Down';
        const rangeCandle50 = candleStickData.slice(-50);
        const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
        const minRange45 = getMinOnListCandle(rangeCandle50.slice(0, 45), 3);


        const max4Range15 = getMaxOnListCandle(candleStickData.slice(-15), 4);
        const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
            candleStickData.slice(-25)
        );
        if (true && (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up"))) {
            const index = candleStickData.slice(-15).findIndex(candle => +candle[4] === +max4Range15);
            if (index < 10) {
                const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.8;
                const CONDITION_1__ = max4Range15 > lastestCandle[4] * 1.006;
                const CONDITION_2__ = EstRR > 1 && EstRR < 2;
                if (true && CONDITION_2__) {
                    slPercent = EstRR;
                    type = "up";
                    isAllowOrder = true;
                    timeStamp = lastestCandle[0];
                }
            }
        }

        if (
            false &&
            isUpCandle(lastestCandle)
        ) {

            const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
                candleStickData.slice(-25)
            );

            if (true && (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up")) && minRange50 * 1.001 > lastestCandle[3]) {
                const EstRR = (lastestCandle[4] / minRange50 - 1) * 100 * 1.25;

                const CONDITION_6__ = maxContinueDown < 6;
                const CONDITION_7__ = EstRR > 0.8 && EstRR < 2;

                if (CONDITION_6__ && CONDITION_7__) {
                    slPercent = EstRR;
                    type = "up";
                    isAllowOrder = true;
                    timeStamp = lastestCandle[0];
                }
            }
        } else if (false && isDownCandle(lastestCandle) && minRange45 * 0.996 > lastestCandle[4]) {
            const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1;
            const CONDITION_1__ = EstRR > 1.5;
            if (CONDITION_1__) {
                slPercent = EstRR;
                type = "down";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        }
    } else {
        trend = 'No Significant Trend';
    }

    return { type, slPercent, isAllowOrder, timeStamp };
};
6