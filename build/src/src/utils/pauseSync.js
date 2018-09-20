/*
 * pauseSync: General purpose util
*/

module.exports = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
