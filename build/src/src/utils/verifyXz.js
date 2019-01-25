const shell = require('./shell');

/**
 * Verify a compressed .xz file
 *
 * @param {String} PATH file path: ./dir/file.tar.xz
 * @return {Bool}:
 * - If the `xz -t` succeeds, returns true
 * - If the file is missing, returns false
 * - If the file is not a .xz, returns false
 * - If the file is corrupted, returns false
 */
const verifyXz = (PATH) => shell(`xz -t ${PATH}`)
    .then(() => ({
        success: true,
    }))
    .catch((e) => ({
        success: false,
        message: e.message,
    }));

module.exports = verifyXz;
