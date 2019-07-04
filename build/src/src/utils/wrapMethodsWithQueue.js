const async = require("async");
const { promisify } = require("util");

/**
 * Wrap function pushes an ipfsTasks.download task to the queue.
 * This task HAS to be an async func, which no paramaters will be passed to
 * It returns the promisified q.push, which is a promise.
 * It will resolve with the result of ipfsTasks.download,
 * and reject with its error
 *
 * @param {object} methods, library object.
 * methods = {
 *   cat: async function() {}
 * }
 * @param {object} params, params for the async queue
 */
function wrapMethodsWithQueue(methods, params = {}, options = {}) {
  // Parameters
  const { times = 3, concurrency = 10, intervalBase = 225 } = params;

  // create a queue object
  const q = async.queue(function(task, callback) {
    // async.retry passes 1 argument to the second arg: callback function
    async.retry(
      {
        times,
        interval: function(retryCount) {
          // exponential backoff: 450, 900, 1800ms (if 225)
          return intervalBase * Math.pow(2, retryCount);
        }
      },
      async.asyncify(task), // For good practices
      callback
    );
  }, concurrency);

  /*
   * Standard: q.push(async_function, callback)
   * By promisifying, q.push(async_function) returns a promise,
   * which will resolve with the result of the asyncFunction
   * and be rejected if it fails
   * > Notice that the async_function (task), will be run through
   * a retry flow, where the first n-1 errors will be silenced
   */
  const pushTaskAsync = promisify(q.push);

  const wrappedMethods = {};
  for (const [key, method] of Object.entries(methods)) {
    // Make sure the method is an async function
    if (!options.disableChecks)
      if (
        typeof method !== "function" ||
        method.constructor.name === "AsyncFunction"
      )
        throw Error(`Method ${key} must be a regular async function`);

    // Wrap method with the queue via push task
    wrappedMethods[key] = (...args) =>
      pushTaskAsync(async () => await method(...args));
  }
  return wrappedMethods;
}

/*
 * With the current construction you can just await the download function
 * or .then() it and it will behave normally as it was not handled in
 * a queue with multiple retry attempts
 */

// Expose methods

module.exports = wrapMethodsWithQueue;
