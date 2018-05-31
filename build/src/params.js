// console.trace('CHANGE BACK THE REALM to: dappnode_admin')
module.exports = {

  // Autobahn parameters
  autobahnUrl: 'ws://my.wamp.dnp.dappnode.eth:8080/ws',
  // autobahnRealm: 'realm1',
  autobahnRealm: 'dappnode_admin',
  autobahnTag: {
    DAppManagerLog: "log.dappmanager.dnp.dappnode.eth"
  },

  // Installer paths
  CACHE_DIR: './cache/',
  // REPO_DIR: "./dnp_repo/" // ### Production name
  REPO_DIR: "./dnp_repo/", // ### Temporary name for development
  DNCORE_DIR: 'DNCORE',
  DAPPNODE_PACKAGE_NAME: 'dappnode_package.json',
  DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  ENV_FILE_EXTENSION: '.env',

  // Docker parameters
  TMP_REPO_DIR: "./tmp_dnp_repo/",
  DAPPNODE_PACKAGE_NAME: 'dappnode_package.json',
  DNP_CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CORE_CONTAINER_NAME_PREFIX: "DAppNodeCore-",

  // Docker compose parameters
  DNP_VERSION_TAG: "dnp_version",
  DNS_SERVICE: "172.33.1.2",
  DNP_NETWORK: "dncore_network",
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",

  // IPFS parameters
  IPFS: (process.env.IPFS_REDIRECT || "my.ipfs.dnp.dappnode.eth"),

  // Wweb3 parameters
  possibleWeb3Hosts: [
    process.env.WEB3HOSTWS || "ws://my.ethchain.dnp.dappnode.eth:8546",
    "wss://mainnet.infura.io/ws"
  ],

}
