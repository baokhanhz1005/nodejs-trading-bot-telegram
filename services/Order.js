import { ENDPOINT_TYPE } from "../constant.js";
import {
  callApiBinanceFt,
  callApiBinanceFutureWithAuth,
} from "../utils/request.js";

const API = {
  market: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/order`;
    return callApiBinanceFutureWithAuth(URL, "POST", params.data).then(
      (res) => res
    );
  },
  updateOrder: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/order`;
    return callApiBinanceFutureWithAuth(URL, "PUT", params.data).then(
      (res) => res
    );
  },
};

export default API;
