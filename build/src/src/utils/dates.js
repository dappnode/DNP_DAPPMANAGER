/**
 * @param {string|number} 1563728142
 * @returns {string} Today, 15 min ago
 */
function parseStaticDate(rawDate) {
  if (!rawDate) return null;

  let date = new Date(rawDate);
  let now = new Date();
  if (sameDay(date, now)) {
    const minAgo = Math.floor((now - date) / 1000 / 60);
    if (minAgo < 30) {
      return "Today, " + minAgo + " min ago";
    }
    return "Today, " + date.toLocaleTimeString();
  }
  return date.toLocaleString();
}

/**
 * Check if two date objects are in the same calendar day
 * @param {date} d1
 * @param {date} d2
 * @returns {bool} isSameDay
 */
function sameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * @param {string|number} 1563728142
 * @returns {string} Today, 15 min ago
 */
function parseDiffDates(rawDatePrev, rawDateNext) {
  if (!rawDatePrev) return null;
  if (!rawDateNext) rawDateNext = Date.now();

  // The difference will always be absolute.
  // Make sure rawDatePrev < rawDateNext
  if (rawDatePrev > rawDateNext) {
    const _rawDatePrev = rawDatePrev;
    rawDatePrev = rawDateNext;
    rawDateNext = _rawDatePrev;
  }

  const secDiff = Math.floor((rawDateNext - rawDatePrev) / 1000);
  const minDiff = Math.floor(secDiff / 60);
  const hourDiff = Math.floor(minDiff / 60);

  if (hourDiff > 1) return `${hourDiff} hours`;
  if (hourDiff) return `${hourDiff} hour`;
  if (minDiff > 1) return `${minDiff} minutes`;
  if (minDiff) return `${minDiff} minute`;
  return `0 minutes`;
}

module.exports = {
  parseStaticDate,
  parseDiffDates
};
