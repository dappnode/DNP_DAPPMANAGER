/**
 * Randomize an interval
 *
 * Example:
 * getRandomizedInterval(50, 10) // 50 +/- 10 = [40, 60]
 *
 * @param baseInterval
 * @param variation
 * @returns
 */
export function getRandomizedInterval(
    baseInterval: number,
    variation: number
): number {
    const randomAdjustment = Math.round((Math.random() * 2 - 1) * variation); // Random integer between -variation and +variation
    return baseInterval + randomAdjustment;
}