const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * If this method is invoked as its util.promisify()ed version,
 * it returns a Promise for an Object with stdout and stderr properties.
 * In case of an error (including any error resulting in an exit code other than 0),
 * a rejected promise is returned, with the same error object given in the callback,
 * but with an additional two properties stdout and stderr.
 */

/**
 * If timeout is greater than 0, the parent will send the signal
 * identified by the killSignal property (the default is 'SIGTERM')
 * if the child runs longer than timeout milliseconds.
 */
const timeout = 3*60*1000; // ms

function shell(cmd) {
    return exec(cmd, {timeout})
    .then((res) => res.stdout)
    .catch((err) => {
        if (err.signal === 'SIGTERM') {
            throw Error(`cmd "${err.cmd}" timed out (${timeout} ms)`);
        }
        throw err;
    });
}

module.exports = shell;
