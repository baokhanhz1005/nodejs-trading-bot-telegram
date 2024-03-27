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

    if (
        true &&
        (checkFullCandle(lastestCandle, "up") || checkPinbar(lastestCandle, "up"))
    ) {
        const rangeCandle50 = candleStickData.slice(-50);
        const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
        const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
        const minRange45 = getMinOnListCandle(rangeCandle50.slice(0, 45), 3);
        const maxRange45 = getMaxOnListCandle(rangeCandle50.slice(0, 45), 2);

        const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
            candleStickData.slice(-25)
        );

        if (true && minRange50 * 1.001 > lastestCandle[3]) {
            const EstRR = (lastestCandle[4] / minRange50 - 1) * 100 * 1.2;

            const CONDITION_6__ = maxContinueDown < 6;
            const CONDITION_7__ = EstRR > 0.8 && EstRR < 2.5;

            if ( CONDITION_6__ && CONDITION_7__ ) {
                slPercent = EstRR;
                type = "up";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        } else if (true && maxRange45 * 1.0015 < lastestCandle[2]) {
            const EstRR = (lastestCandle[4] / lastestCandle[3] - 1) * 100 * 1.85;
            const CONDITION_2__ = EstRR > 1.2;
            if ( CONDITION_2__ ) {
                slPercent = EstRR;
                type = "up";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        }
    } else if (
        true &&
        isDownCandle(lastestCandle)
    ) {
        const rangeCandle50 = candleStickData.slice(-50);
        const minRange50 = getMinOnListCandle(candleStickData.slice(-50), 3);
        const maxRange50 = getMaxOnListCandle(candleStickData.slice(-50), 2);
        const minRange45 = getMinOnListCandle(rangeCandle50.slice(0, 45), 3);
        const avrgField = (maxRange50 + minRange50) * 0.5;
        const { maxContinueUp, maxContinueDown } = findContinueSameTypeCandle(
            candleStickData.slice(-25)
        );
        if (true && maxRange50 * 0.999 < lastestCandle[2]) {
            const EstRR = (maxRange50 / lastestCandle[4] - 1) * 100 * 1.2;
            const CONDITION_6__ = maxContinueUp < 6;
            const CONDITION_8__ = EstRR > 0.8 && EstRR < 2.5;

            if ( CONDITION_6__ && CONDITION_8__ ) {
                slPercent = EstRR;
                type = "down";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        } else if (true && minRange45 * 0.9985 > lastestCandle[3]) {
            const EstRR = (lastestCandle[2] / lastestCandle[4] - 1) * 100 * 1.85;
            const CONDITION_1__ = EstRR > 1.2;
            if (CONDITION_1__) {
                slPercent = EstRR;
                type = "down";
                isAllowOrder = true;
                timeStamp = lastestCandle[0];
            }
        }
    }

    return { type, slPercent, isAllowOrder, timeStamp };
};
