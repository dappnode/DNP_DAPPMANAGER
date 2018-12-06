/**
 * Each call on this list will be automatically registered to WAMP
 * The key of the object property will be the call name as
 *     <key>.dappmanager.dnp.dappnode.eth
 */

module.exports = {
    installPackage: require('./installPackage'),
    installPackageSafe: require('./installPackageSafe'),
    removePackage: require('./removePackage'),
    togglePackage: require('./togglePackage'),
    restartPackage: require('./restartPackage'),
    restartPackageVolumes: require('./restartPackageVolumes'),
    logPackage: require('./logPackage'),
    updatePackageEnv: require('./updatePackageEnv'),
    listPackages: require('./listPackages'),
    fetchDirectory: require('./fetchDirectory'),
    fetchPackageVersions: require('./fetchPackageVersions'),
    fetchPackageData: require('./fetchPackageData'),
    managePorts: require('./managePorts'),
    getUserActionLogs: require('./getUserActionLogs'),
    resolveRequest: require('./resolveRequest'),
    diskSpaceAvailable: require('./diskSpaceAvailable'),
    getStats: require('./getStats'),
    changeIpfsTimeout: require('./changeIpfsTimeout'),
    requestChainData: require('./requestChainData'),
};
