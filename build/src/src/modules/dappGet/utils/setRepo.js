const fs = require('fs');
const {promisify} = require('util');
const params = require('params');

const {REPO_FILE} = params;

function setRepo(repo) {
    return promisify(fs.writeFile)(
        REPO_FILE,
        JSON.stringify(repo, null, 2),
        'utf8'
    );
}

module.exports = setRepo;
