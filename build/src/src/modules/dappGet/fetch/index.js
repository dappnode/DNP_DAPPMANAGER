const fetchState = require('./fetchState');
const fetchRequest = require('./fetchRequest');
const fetchDirectory = require('./fetchDirectory');
const setRepo = require('../utils/setRepo');
const getRepo = require('../utils/getRepo');

async function fetch({req, state, directory}) {
    const repo = await getRepo();

    if (req) {
        await fetchRequest(req, repo);
    }
    if (state) {
        await fetchState(state, repo);
    }
    if (directory) {
        await fetchDirectory(repo);
    }

    // #### Fix latest tag. Change for 'X'
    for (const pkg of Object.keys(repo)) {
        for (const ver of Object.keys(repo[pkg])) {
            for (const dep of Object.keys(repo[pkg][ver])) {
                if (repo[pkg][ver][dep] === 'latest') repo[pkg][ver][dep] = 'X';
            }
        }
    }

    await setRepo(repo);
}

module.exports = fetch;
