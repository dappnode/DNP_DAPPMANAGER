function getFromRepo(repo, name, ver) {
    return (repo[name][ver] || {}).dependencies || {};
}

module.exports = getFromRepo;

