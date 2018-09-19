function codeIpfs(manifest, verReq) {
    if (verReq && verReq.startsWith('/ipfs/')) {
        return manifest.version + '-' + verReq.replace('/ipfs/', 'ipfs-');
    } else {
        return;
    }
}

module.exports = codeIpfs;
