export const RR = 3;
export const REWARD = 0.2;
export const MINIMUM_PERCENT_ORDER = 0.25;
export const LIMIT_ORDER = Math.ceil((REWARD * 100) / MINIMUM_PERCENT_ORDER);
export const COST = (0.1 * Math.ceil((REWARD * 100) / 0.83)) / 100;
