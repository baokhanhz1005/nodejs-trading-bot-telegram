import axios from "axios";
import { DOMAIN } from "../constant.js";

export const callApiBinanceFt = async (
  endpoint,
  method = "GET",
  body,
  other
) => {
  const domainBinanceFt = DOMAIN.BINANCE_FUTURE;
  const URL = `${domainBinanceFt}/${endpoint}`;
  return axios({
    method,
    url: URL,
    params: body,
  }).catch((err) => {
    console.log(err);
  });
};
