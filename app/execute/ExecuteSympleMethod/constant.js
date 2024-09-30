export const RR = 1.2;
export const REWARD = 0.25;
export const MINIMUM_PERCENT_ORDER = 0.3;
export const LIMIT_ORDER = Math.ceil((REWARD * 100) / MINIMUM_PERCENT_ORDER);
export const COST = (0.1 * Math.ceil((REWARD * 100) / 0.83)) / 100;


export const inputController = {
    RR: 0.7,
    REWARD: 1,
}