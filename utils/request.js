import axios from "axios";
import { APP_CONFIG, DOMAIN } from "../constant.js";
import crypto from "crypto";

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

export const callApiBinanceFutureWithAuth = async (
  endpoint,
  method = "GET",
  body = {},
  other
) => {
  try {
    const headers = {
      "X-MBX-APIKEY": APP_CONFIG.API_KEY,
    };
    const orderParams = new URLSearchParams(body);
    const signature = crypto
      .createHmac("sha256", APP_CONFIG.API_SECRET)
      .update(orderParams.toString())
      .digest("hex");

    const domainBinanceFt = DOMAIN.BINANCE_FUTURE;
    let URL = `${domainBinanceFt}/${endpoint}?${orderParams}&signature=${signature}`;
    return axios({
      method,
      url: URL,
      headers,
    });
  } catch (err) {
    console.error("errorrrr...", err);
  }
};

export const urlHasQueryString = (url) => {
  const array = url.split("?");

  if (array.length > 1 && array[1] !== "") {
    return true;
  }
  return false;
};
