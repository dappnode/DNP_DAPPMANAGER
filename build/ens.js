var Web3 = require('web3');

const WEB3HOSTWS = process.env.WEB3HOSTWS || "ws://my.ethchain.repo.dappnode.eth:8546";
var web3 = new Web3(WEB3HOSTWS);

const ensAbi = [{ "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "resolver", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "label", "type": "bytes32" }, { "name": "owner", "type": "address" }], "name": "setSubnodeOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "ttl", "type": "uint64" }], "name": "setTTL", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "ttl", "outputs": [{ "name": "", "type": "uint64" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "resolver", "type": "address" }], "name": "setResolver", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "owner", "type": "address" }], "name": "setOwner", "outputs": [], "payable": false, "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "owner", "type": "address" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": true, "name": "label", "type": "bytes32" }, { "indexed": false, "name": "owner", "type": "address" }], "name": "NewOwner", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "resolver", "type": "address" }], "name": "NewResolver", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "ttl", "type": "uint64" }], "name": "NewTTL", "type": "event" }];
const ensAddr = '0x314159265dd8dbb310642f98f50c066173c1259b'
const resolverAbi = [{ "constant": true, "inputs": [{ "name": "interfaceID", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "key", "type": "string" }, { "name": "value", "type": "string" }], "name": "setText", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "contentTypes", "type": "uint256" }], "name": "ABI", "outputs": [{ "name": "contentType", "type": "uint256" }, { "name": "data", "type": "bytes" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "x", "type": "bytes32" }, { "name": "y", "type": "bytes32" }], "name": "setPubkey", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "content", "outputs": [{ "name": "ret", "type": "bytes32" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "addr", "outputs": [{ "name": "ret", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "key", "type": "string" }], "name": "text", "outputs": [{ "name": "ret", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "contentType", "type": "uint256" }, { "name": "data", "type": "bytes" }], "name": "setABI", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "name", "outputs": [{ "name": "ret", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "name", "type": "string" }], "name": "setName", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "hash", "type": "bytes32" }], "name": "setContent", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "node", "type": "bytes32" }], "name": "pubkey", "outputs": [{ "name": "x", "type": "bytes32" }, { "name": "y", "type": "bytes32" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "node", "type": "bytes32" }, { "name": "addr", "type": "address" }], "name": "setAddr", "outputs": [], "payable": false, "type": "function" }, { "inputs": [{ "name": "ensAddr", "type": "address" }], "payable": false, "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "a", "type": "address" }], "name": "AddrChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "hash", "type": "bytes32" }], "name": "ContentChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "name", "type": "string" }], "name": "NameChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": true, "name": "contentType", "type": "uint256" }], "name": "ABIChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": false, "name": "x", "type": "bytes32" }, { "indexed": false, "name": "y", "type": "bytes32" }], "name": "PubkeyChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "node", "type": "bytes32" }, { "indexed": true, "name": "indexedKey", "type": "string" }, { "indexed": false, "name": "key", "type": "string" }], "name": "TextChanged", "type": "event" }];

setInterval(function () {
    web3.eth.net.isListening().then().catch(e => {
        console.log('[ - ] Lost connection to the node: ' + process.env.WEB3HOSTWS + ', reconnecting');
        web3.setProvider(WEB3HOSTWS);
    })
}, 10000)

function namehash(name) {
    var node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (name != '') {
        var labels = name.split(".");
        for (var i = labels.length - 1; i >= 0; i--) {
            node = web3.utils.sha3(node + web3.utils.sha3(labels[i]).slice(2), { encoding: 'hex' });
        }
    }
    return node.toString();
}

exports.getContent = async (name) => {

    const node = namehash(name);
    console.log(node);

    var ens = new web3.eth.Contract(ensAbi, ensAddr);

    const resolverAddress = await ens.methods.resolver(node).call();
    console.log("Addr: " + resolverAddress);
    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    const resolver = new web3.eth.Contract(resolverAbi, resolverAddress);
    const content = await resolver.methods.text(node, "dnslink").call();
    return content;
}
