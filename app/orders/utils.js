export const getQuantity = (entry, volume = 20, limitVolume = 25) => {
    let result;
    if (entry) {
        result = Math.ceil(volume / entry);
        if (result * entry > limitVolume) {
          result = Math.floor(volume / entry);
        }
    }
    return result;
};
