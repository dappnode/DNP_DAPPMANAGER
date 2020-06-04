/**
 * HOC function
 * Make any async function attempt a 'times' number of retries before returning an error
 * @param fn
 * @param times
 * @returns
 */
export const retryable = (
  fn: () => Promise<void>,
  times = 3
): (() => Promise<void>) => (): Promise<void> =>
  new Promise((resolve, reject) => {
    let attempt = 0;
    function retryAttempt() {
      fn().then(resolve, e => {
        if (e && attempt++ < times)
          setTimeout(retryAttempt, 1000 * Math.random());
        else reject(e);
      });
    }
    retryAttempt();
  });
