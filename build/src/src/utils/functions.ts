/**
 * Pipe functions.
 * const add = (a, b) => a + b
 * const square = (a) => a ** 2
 * const addAndSquare = pipe(add, square)
 */
export function pipe<T>(...ops: ((arg: T) => T)[]): (arg: T) => T {
  return ops.reduce((a, b) => (arg: T): T => b(a(arg)));
}
