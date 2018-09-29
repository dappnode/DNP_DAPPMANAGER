const fs = require('fs');
const {promisify} = require('util');
const logs = require('../../../logs')(module);
const params = require('../../../params');

const {REPO_FILE} = params;

function getRepo() {
    return promisify(fs.readFile)(REPO_FILE, 'utf8')
    .then(JSON.parse)
    .catch((e) => {
        // If repo does not exist => ENOENT error, don't log just initialize it
        if (e.code !== 'ENOENT') logs.error(e);
        return {};
    });
}

module.exports = getRepo;
