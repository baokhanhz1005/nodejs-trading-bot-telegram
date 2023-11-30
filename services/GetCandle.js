import { ENDPOINT_TYPE } from "../constant.js";
import { callApiBinanceFt } from "../utils/request.js";

const API = {
  getList: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/klines`;
    return callApiBinanceFt(URL, "GET", params.data).then((res) => res);
  },
  getCurrent: async params => {
    const { symbol } = params;
    const URL = `${ENDPOINT_TYPE.fAPIv1}/ticker/price?symbol=${symbol}`;
    return callApiBinanceFt(URL, "GET", params.data).then((res) => res);
  }
};

export default API;