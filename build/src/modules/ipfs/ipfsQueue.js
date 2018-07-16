'use strict';

const async = require('async');
const {promisify} = require('util');
const ipfsTasksDefault = require('./ipfsTasks');

const ipfsQueueFactory = ({
    ipfsTasks = ipfsTasksDefault({}),
    options = {},
}) => {
    // Parameters
    const retryAttempts = options.retryAttempts || 3;
    const concurrency = options.concurrency || 2;
    const intervalBase = options.intervalBase || 225;

    // create a queue object with concurrency 2
    let q = async.queue(function(task, callback) {
        // async.retry passes 1 argument to the second arg: callback function
        async.retry({
            times: retryAttempts,
            interval: function(retryCount) {
                // exponential backoff: 450, 900, 1800ms (if 225)
                return intervalBase * Math.pow(2, retryCount);
            },
        }, task, callback);
    }, concurrency);
    /* If you want to log out when the queue is empty (for debugging)
    * q.drain = function() {
    *     console.log('all items have been processed');
    * };
    */

    /*
    * Standard: q.push(async_function, callback)
    * By promisifying, q.push(async_function) returns a promise,
    * which will resolve with the result of the asyncFunction
    * and be rejected if it fails
    * > Notice that the async_function (task), will be run through
    * a retry flow, where the first n errors will be silenced
    */
    const pushTaskAsync = promisify(q.push);

    /*
    * This wrap function pushes an ipfsTasks.download task to the queue.
    * This task HAS to be an async func, which no paramaters will be passed to
    * It returns the promisified q.push, which is a promise.
    * It will resolve with the result of ipfsTasks.download,
    * and reject with its error
    */
    const download = (HASH, PATH, logChunks) =>
        pushTaskAsync(async () => await ipfsTasks.download(HASH, PATH, logChunks));

    const cat = (HASH) =>
        pushTaskAsync(async () => await ipfsTasks.cat(HASH));

    /*
    * With the current construction you can just await the download function
    * or .then() it and it will behave normally as it was not handled in
    * a queue with multiple retry attempts
    */

    // Expose methods
    return {
        download,
        cat,
    };
};

module.exports = ipfsQueueFactory;

