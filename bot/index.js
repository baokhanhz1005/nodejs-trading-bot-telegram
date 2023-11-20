import { COMMAND, MESSAGE } from "../constant.js";
import { sendCurrentTime } from "../utils.js";
import { BreakOut } from "./Breakout/index.js";
import { IndicatorTechnical } from "./IndicatorTechnical/index.js";
import { TrackingBigPriceTrend } from "./TrackingBigPriceTrend/index.js";
import { TrackingEngulfing } from "./TrackingEngulfing/index.js";

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
    default:
      bot.sendMessage(chatId, MESSAGE.NO_COMMAND);
  }
};
