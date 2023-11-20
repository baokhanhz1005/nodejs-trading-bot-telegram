import { ENDPOINT_TYPE } from "../constant.js";
import { callApiBinanceFt } from "../utils/request.js";

const API = {
  info: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/exchangeInfo`;
    return callApiBinanceFt(URL, "GET").then((res) => res);
  },
};

export default API;
