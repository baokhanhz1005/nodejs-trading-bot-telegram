import axios from "axios";
import { APP_CONFIG } from "../constant.js";

const API = {
  sendMessage: async (chat_id, text) => {
    const URL = `https://api.telegram.org/bot${APP_CONFIG.TOKEN}/sendMessage`;
    return axios({
      method: "POST",
      url: URL,
      params: {
        chat_id,
        text,
      },
    }).catch((err) => {
      console.log(err);
    });
  },
};

export default API;
