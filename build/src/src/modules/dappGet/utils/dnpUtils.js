function getVersion(dnps, name, version) {
    return ((dnps[name] || {}).versions || {})[version];
}

function hasVersion(dnps, name, version) {
    return Boolean(getVersion(dnps, name, version));
}

function getDependencies(dnps, name, version) {
    return getVersion(dnps, name, version);
}

function setVersion(dnps, name, version, value) {
    if (!dnps[name]) dnps[name] = {versions: {}};
    dnps[name].versions[version] = value;
}

function getVersionsFromDnp(dnp) {
    return dnp.versions;
}

module.exports = {
    getVersion,
    hasVersion,
    setVersion,
    getDependencies,
    getVersionsFromDnp,
};
