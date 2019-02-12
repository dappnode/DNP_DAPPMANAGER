const randomBytes = require('util').promisify(require('crypto').randomBytes);

/**
 * Generates a random hex string
 *
 * @param {Integer} byteLength byte length
 * @return {String} hex string: i.e.
 *   adf572278b5fab3ee2b920a85ae86bd9d964b4f3b7402c35023498a89afe4da0
 */
const randomToken = (byteLength) => randomBytes(byteLength || 32).then((buffer) => buffer.toString('hex'));

module.exports = randomToken;
