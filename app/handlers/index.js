import { COMMAND, MESSAGE } from "../../constant.js";
import { sendCurrentTime } from "../../utils.js";
import { TestingFunction } from "../Test/TesingFunction/index.js";
import { ExecuteBigPriceTrend } from "../execute/ExecuteBigPriceTrend/index.js";
import { OrderMarket } from "../orders/MarketOrder/index.js";
import { BreakOut } from "./Breakout/index.js";
import { IndicatorTechnical } from "./IndicatorTechnical/index.js";
import { Test } from "../Test/index.js";
import { TrackingBigPriceTrend } from "./TrackingBigPriceTrend/index.js";
import { TrackingEngulfing } from "./TrackingEngulfing/index.js";
import { TrackingPriceSafety } from "./TrackingPriceSafety/index.js";
import { ExecuteBigPriceTrendV2 } from "../execute/ExecuteBigPriceTrendV2/index.js";
import { ExecuteSympleMethod } from "../execute/ExecuteSympleMethod/index.js";
import { handleOrderSymbol } from "../execute/handleOrderSymbol/index.js";
import { AnalysisByTimeLine } from "./AnalysistByTimeLine/index.js";
import { TestFunctionUtility } from "../laboratory/index.js";
import { ExecuteSympleMethod1M } from "../execute/ExecuteSympleMethod/index.1m.js";
import { BackTestTrailing } from "../execute/ExecuteTrailing/backtest.js";
import { BackTestFOMO } from "../execute/ExecuteFOMO/backtest.js";

export const handleRunBot = async (payload) => {
  const { bot = () => {}, chatId, command } = payload;
  const [textCommand, timeLine] = command.split(" ");
  const newPayload = {
    ...payload,
    timeLine,
  };

  if (Object.values(COMMAND).includes(textCommand)) {
    sendCurrentTime(bot, chatId);
  }

  switch (textCommand) {
    case COMMAND.RUN:
      TrackingEngulfing(newPayload);
      break;
    case COMMAND.BREAK_OUT:
      BreakOut(newPayload);
    case COMMAND.RUN_TECHNICAL:
      IndicatorTechnical(newPayload);
      break;
    case COMMAND.BIG:
      TrackingBigPriceTrend(newPayload);
      break;
    case COMMAND.SAFE:
      TrackingPriceSafety(newPayload);
      break;
    case COMMAND.TEST:
      Test(newPayload);
      break;
    case COMMAND.ORDER:
      handleOrderSymbol(newPayload);
      break;
    case COMMAND.TEST_FUNCTION:
      TestingFunction(newPayload);
      break;

    case COMMAND.EXECUTE_BIG_PRICE:
      ExecuteBigPriceTrend(newPayload);
      break;

    case COMMAND.EXECUTE_BIG_PRICE_V2:
      ExecuteBigPriceTrendV2(newPayload);
      break;

    case COMMAND.EXECUTE_SIMPLE_METHOD:
      ExecuteSympleMethod(newPayload);
      break;

    case COMMAND.EXECUTE_SIMPLE_METHOD_V2:
      ExecuteSympleMethod1M(newPayload);
      break;

    case COMMAND.CHECK:
      AnalysisByTimeLine(newPayload);
      break;

    case "test-util": {
      TestFunctionUtility(newPayload);
      break;
    }

    case "back": {
      BackTestTrailing(newPayload);
      break;
    }

    case "fomo": {
      BackTestFOMO(newPayload);

      break;
    }

    default:
      await bot.sendMessage(chatId, MESSAGE.NO_COMMAND);
  }
};
