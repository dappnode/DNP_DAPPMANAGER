const fs = require('fs');
const {promisify} = require('util');
const params = require('params');
const validate = require('utils/validate');

const {REPO_FILE} = params;

function setRepo(repo) {
    console.log('\n\n\n\n\n');
    console.log('SETTING REPO');
    console.log('\n\n\n\n\n');
    console.log(repo);
    console.log('\n\n\n\n\n');
    validate.path(REPO_FILE);
    return promisify(fs.writeFile)(
        REPO_FILE,
        JSON.stringify(repo, null, 2),
        'utf8'
    );
}

module.exports = setRepo;
