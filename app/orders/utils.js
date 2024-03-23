export const getQuantity = (entry, volume = 20, limitVolume = 25) => {
    let result = null;
    if (entry) {
        result = Math.ceil(volume / entry);
    }
    return result;
};
