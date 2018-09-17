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

    await setRepo(repo);
}

module.exports = fetch;
