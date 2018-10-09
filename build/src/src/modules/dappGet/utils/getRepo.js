const fs = require('fs');
const {promisify} = require('util');
const logs = require('logs.js')(module);
const params = require('params');

const {REPO_FILE} = params;

function getRepo() {
    return promisify(fs.readFile)(REPO_FILE, 'utf8')
    .then((res) => {
        const repo = JSON.parse(res);
        console.log('\n\n\n\n\n');
        console.log('GETTING REPO - no error');
        console.log('\n\n\n\n\n');
        console.log(repo);
        console.log('\n\n\n\n\n');
        return repo;
    })
    .catch((e) => {
        console.log('\n\n\n\n\n');
        console.log('GETTING REPO - ERROR - repo does not exists');
        console.log('\n\n\n\n\n');
        // If repo does not exist => ENOENT error, don't log just initialize it
        if (e.code !== 'ENOENT') logs.error(e);
        return {};
    });
}

module.exports = getRepo;
