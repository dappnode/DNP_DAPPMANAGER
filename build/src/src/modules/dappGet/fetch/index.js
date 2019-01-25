const fetchDependencies = require('./fetchDependencies');
const fetchVersions = require('./fetchVersions');

module.exports = {
    dependencies: fetchDependencies,
    versions: fetchVersions,
};
