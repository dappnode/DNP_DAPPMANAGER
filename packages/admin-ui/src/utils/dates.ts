/**
 * @param rawDate 1563728142
 * @param [hideTime]
 * @returns Today, 15 min ago
 */
export function parseStaticDate(
  rawDate: string | number,
  hideTime = false
): string {
  if (!rawDate) return "";

  const date = new Date(rawDate);
  const now = new Date();
  if (sameDay(date, now)) {
    const minAgo = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (minAgo < 30) {
      return "Today, " + minAgo + " min ago";
    } else {
      return "Today, " + date.toLocaleTimeString();
    }
  }
  // Show as: "Nov 19, 2019, 14:50"
  return date.toLocaleString([], {
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: hideTime ? undefined : "2-digit",
    minute: hideTime ? undefined : "2-digit"
  });
}

/**
 * Check if two date objects are in the same calendar day
 * @param d1
 * @param d2
 * @returns isSameDay
 */
function sameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * @param prevRaw 1563728142
 * @param rawDateNext 1563728142
 * @returns Today, 15 min ago
 */
export function parseDiffDates(
  prevRaw: string | number,
  nextRaw: string | number = Date.now()
) {
  const prev = typeof prevRaw === "string" ? parseInt(prevRaw) : prevRaw;
  const next = typeof nextRaw === "string" ? parseInt(nextRaw) : nextRaw;

  if (!prev || !next) return "";

  // The difference will always be absolute.
  // Make sure rawDatePrev < rawDateNext
  const diff = Math.abs(prev - next);

  const secDiff = Math.floor(diff / 1000);
  const minDiff = Math.floor(secDiff / 60);
  const hourDiff = Math.floor(minDiff / 60);

  if (hourDiff > 1) return `${hourDiff} hours`;
  if (hourDiff) return `${hourDiff} hour`;
  if (minDiff > 1) return `${minDiff} minutes`;
  if (minDiff) return `${minDiff} minute`;
  return `0 minutes`;
}
