import axios from "axios";
import { APP_CONFIG } from "../constant.js";

const API = {
  sendMessage: async (params) => async (chat_id, text) => {
    await axios.post(
      `https://api.telegram.org/bot${APP_CONFIG.TOKEN}/sendMessage`,
      {
        chat_id,
        text,
      }
    );

    return true;
  },
};

export default API;
