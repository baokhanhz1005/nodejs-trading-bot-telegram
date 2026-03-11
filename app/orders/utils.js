export const getQuantity = (entry, volume = 20, limitVolume = 25) => {
  let result = null;
  if (entry) {
    result = (+volume / +entry).toFixed(2);
  }
  return result;
};
