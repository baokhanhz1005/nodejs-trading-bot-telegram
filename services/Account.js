import { ENDPOINT_TYPE } from "../constant.js";
import {
  callApiBinanceFt,
  callApiBinanceFutureWithAuth,
} from "../utils/request.js";

const API = {
  info: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv2}/account`;
    return callApiBinanceFutureWithAuth(URL, "GET", params.data)
      .then((res) => res)
      .catch((err) => {
        console.log(err);
      });
  },
};

export default API;
