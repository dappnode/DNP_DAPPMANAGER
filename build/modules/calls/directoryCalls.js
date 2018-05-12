// node modules
const semver = require('semver')
const Web3 = require('web3')

// dedicated modules
const params = require('../../params')

const possibleWeb3Hosts = params.possibleWeb3Hosts

var WEB3HOSTWS;
var web3;

// FOR DEVELOPING PURPOSES ONLY
// ############################

// testing dappnode's provider and defaulting to infura if not ready
init();

async function init() {
  WEB3HOSTWS = await getWorkingWeb3Host(possibleWeb3Hosts);
  web3 = new Web3(WEB3HOSTWS);
  console.log('CONNECTED to ETHCHAIN \n   host: '+WEB3HOSTWS)
  watchWeb3Provider();
}


async function getWorkingWeb3Host(web3HostsArray) {
  for (let i = 0; i < web3HostsArray.length; i++) {
    let _testWeb3Host = await testWeb3Host(web3HostsArray[i]);
    if (_testWeb3Host.works) {
      // console.log('TESTING '+web3HostsArray[i]+' WORKED')
      return web3HostsArray[i];
    } else {
      // console.log('TESTING '+web3HostsArray[i]+' NOT WORKING, reason: '+_testWeb3Host.reason)
    }
  }
  throw Error('NO WEB3 HOST IS WORKING');
}

function testWeb3Host(web3Host) {
  return new Promise(function(resolve, reject) {
    var _web3 = new Web3(web3Host);
    _web3.eth.isSyncing()
    .then(function(isSyncing){
      if (isSyncing) {
        return resolve({
          works: false,
          reason: 'still syncing'
        })
      } else {
        return resolve({
          works: true,
          reason: ''
        })
      }
    })
    .catch(function(err){
      return resolve({
        works: false,
        reason: err
      })
    });
  });
}


function watchWeb3Provider() {
  setInterval(function () {
      web3.eth.net.isListening().then().catch(e => {
          console.log('[ - ] Lost connection to the node: ' + WEB3HOSTWS + ', reconnecting');
          web3.setProvider(WEB3HOSTWS);
      })
  }, 10000)
}


const directoryAddr = '0xc8330fB0B7d80A7be4eDB624139e15Ec1f3FfEa3'
const directoryAbi = [{"constant":false,"inputs":[{"name":"name","type":"string"}],"name":"addPackage","outputs":[{"name":"idPackage","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"escapeHatchCaller","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_dac","type":"address"}],"name":"removeOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwnerCandidate","type":"address"}],"name":"proposeOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"}],"name":"isTokenEscapable","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"}],"name":"escapeHatch","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"idPackage","type":"uint256"},{"name":"name","type":"string"}],"name":"updatePackage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"numberOfDAppNodePackages","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"idPackage","type":"uint256"}],"name":"getPackage","outputs":[{"name":"name","type":"string"},{"name":"status","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"idPackage","type":"uint256"},{"name":"newStatus","type":"uint8"}],"name":"changeStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwnerCandidate","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newEscapeHatchCaller","type":"address"}],"name":"changeHatchEscapeCaller","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"escapeHatchDestination","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_escapeHatchCaller","type":"address"},{"name":"_escapeHatchDestination","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"idPackage","type":"uint256"},{"indexed":false,"name":"name","type":"string"}],"name":"PackageAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"idPackage","type":"uint256"},{"indexed":false,"name":"name","type":"string"}],"name":"PackageUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"idPackage","type":"uint256"},{"indexed":false,"name":"newStatus","type":"uint8"}],"name":"StatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"}],"name":"EscapeHatchBlackistedToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"EscapeHatchCalled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"by","type":"address"},{"indexed":true,"name":"to","type":"address"}],"name":"OwnershipRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[],"name":"OwnershipRemoved","type":"event"}]

const DAppNodePackageStatus = ['Preparing', 'Develop', 'Active', 'Deprecated', 'Deleted']

async function getDirectory() {

    const directory = new web3.eth.Contract(directoryAbi, directoryAddr);
    const numberOfDAppNodePackages = parseFloat( await directory.methods.numberOfDAppNodePackages().call() )

    let packages = [];
    for (let i = 0; i < numberOfDAppNodePackages; i++) {
      try {
        const package = await directory.methods.getPackage(i).call();
        packages.push({
          name: package.name,
          status: DAppNodePackageStatus[package.status]
        })
      } catch(e) {
        console.log('Error retrieving package #' + i + ' from directory, err: ' + e)
      }
    }
    return packages
}

module.exports = {
  getDirectory,
}
