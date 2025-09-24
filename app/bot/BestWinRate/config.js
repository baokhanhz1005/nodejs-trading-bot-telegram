
const TYPE = {
    TRADE: 'TRADE',
    BACK_TEST: 'BACK_TEST'
}

const CONFIG_TRADE = {

};

const CONFIG_BACK_TEST = {
    timeStamp: '',
    range: 288,
    prevDay: 0,
};

export const CONFIG = {
    [TYPE.TRADE]: CONFIG_TRADE,
    [TYPE.BACK_TEST]: CONFIG_BACK_TEST
}