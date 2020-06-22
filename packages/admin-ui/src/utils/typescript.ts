/**
 * Use to remove empty types from an array
 * ```js
 * const array: (string | null)[] = ['foo', 'bar', null, 'zoo', null];
 * const filteredArray: string[] = array.filter(notEmpty);
 * ```
 * @param value
 */
export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}
