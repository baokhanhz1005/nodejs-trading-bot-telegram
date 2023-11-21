import axios from "axios";

const API = {
  sendMessage: async (params) => async (chat_id, text) => {
    await axios.post(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        chat_id,
        text,
      }
    );

    return true;
  },
};

export default API;
