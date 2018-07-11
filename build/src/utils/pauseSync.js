

module.exports = function pauseSync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
