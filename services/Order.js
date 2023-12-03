import { ENDPOINT_TYPE } from "../constant.js";
import {
  callApiBinanceFt,
  callApiBinanceFutureWithAuth,
} from "../utils/request.js";

const API = {
  getList: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/openOrders`;
    return callApiBinanceFutureWithAuth(URL, "GET", params.data)
      .then((res) => res)
      .catch((err) => console.log(err));
  },
  getListPosition: async params => {
    const URL = `${ENDPOINT_TYPE.fAPIv2}/positionRisk`;
    return callApiBinanceFutureWithAuth(URL, "GET", params.data)
      .then((res) => res)
      .catch((err) => console.log(err));
  },
  market: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/order`;
    return callApiBinanceFutureWithAuth(URL, "POST", params.data)
      .then((res) => res)
      .catch((err) => console.log(err));
  },
  updateOrder: async (params) => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/order`;
    return callApiBinanceFutureWithAuth(URL, "PUT", params.data)
      .then((res) => res)
      .catch((err) => console.log(err));
  },
  delete: async params => {
    const URL = `${ENDPOINT_TYPE.fAPIv1}/order`;
    return callApiBinanceFutureWithAuth(URL, "DELETE", params.data)
      .then((res) => res)
      .catch((err) => console.log(err));
  },
};

export default API;
