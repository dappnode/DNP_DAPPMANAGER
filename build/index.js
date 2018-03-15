'use strict';
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
const shell = require('shelljs');
const IPFS = process.env.IPFS_REDIRECT || "my.ipfs.dnp.dappnode.eth";
const ipfs = ipfsAPI(IPFS, '5001', {protocol: 'http'});
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const validator = require('validator');
const ens = require('./ens');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var router = express.Router();

router.post('/install', function (req, res) {
    install(req.body.aps);
    res.send("HASH");
});

app.use(router);

app.listen(8888, function () {
    console.log("Listening on port %s...", 8888);
});

async function install(req) {

    var aps = req.split("@");

    var aps_name = aps[0];
    var aps_version = aps[1];
    var aps_hash;
    var aps_manifest;
    var aps_latest_hash;
    var aps_latest_manifest;

    if (!validator.isFQDN(aps_name)) {
        //req is a HASH
        aps_hash = aps[0];
        aps_manifest = await getAPSManifest(aps_name);
        aps_name = aps_manifest.name;
        aps_version = aps_manifest.version;
    }

    if (validator.isFQDN(aps_name)) {
        aps_latest_hash = await ens.getContent(aps_name+".eth");
    } else {
        console.error("No valid APS");
        return;
    }

    console.log("Reading manifest...");
    console.log(aps_latest_hash);
    aps_latest_manifest = await getAPSManifest(aps_latest_hash);
    console.log(aps_latest_manifest);

    if (!aps_version && !aps_hash && !aps_manifest) {
        aps_version = aps_latest_manifest.version;
        aps_hash = aps_latest_hash;
        aps_manifest = aps_latest_manifest;
    }

    if ((aps_version == aps_latest_manifest.version) && (aps_latest_hash != aps_hash)) {
        console.error("No valid HASH version");
        return;
    } else if (aps_hash && aps_version != aps_latest_manifest.version) {
        if (aps_latest_manifest.versions[aps_version] != aps_hash) {
            console.error("No valid HASH version");
            return;
        }
    } else if (aps_version != aps_latest_manifest.version) {
        if (!aps_latest_manifest.versions[aps_version]) {
            console.error("No valid HASH version");
            return;
        } else if (!aps_manifest) {
            aps_manifest = await getAPSManifest(aps_latest_manifest.versions[aps_version]);
        }
        console.log(aps_latest_manifest.versions[aps_version]);
    }

    if (aps_latest_hash == aps_hash) {
        aps_manifest = aps_latest_manifest;
        console.log("Installing hash lastest version");
    }


    console.log("Resolving dependencies...");
    await resolveDependencies(aps_manifest.dependencies);

    console.log("Getting compress image...");
    await hashToFile(aps_manifest.image);

    console.log("Loading image...");
    await loadImage(aps_manifest.image);

    console.log("Starting image...");
    await runImage(aps_manifest)

    console.log("Installed and running!");
}

function getAPSManifest(hash) {
    return new Promise(function (resolve, reject) {
        ipfs.files.cat(hash, function (err, file) {
            if (err) {
                throw err;
            }
            ipfs.pin.add(hash);
            resolve(JSON.parse(file));
        });
    });
}

function resolveDependencies(dependencies) {
    return new Promise(async (resolve, reject) => {
        for (var dep in dependencies) {
            if (dependencies.hasOwnProperty(dep)) {
                console.log(dep + " -> " + dependencies[dep]);
                var hash;
                try {
                    hash = await ens.getContent(dep + ".eth");
                    if (hash === "0x0000000000000000000000000000000000000000") {
                        hash = dependencies[dep];
                    }
                } catch (err) {
                    hash = dependencies[dep];
                }

                console.log("Dep HASH:", hash);
                var manifest = await getAPSManifest(hash);
                console.log(manifest);
                await resolveDependencies(manifest.dependencies);
                await hashToFile(manifest.image);
                await loadImage(manifest.image);
                await runImage(manifest)
                console.log("Installed and running!");
            }
        }
        resolve("OK");
    });
}

function hashToFile(imageManifest) {
    return new Promise(function (resolve, reject) {
        const rstream = ipfs.files.catReadableStream(imageManifest.hash);
        var wstream = fs.createWriteStream(imageManifest.path);
        rstream.pipe(wstream, { end: true });
        var dataLength = 0;
        var previusState = 0;
        rstream
            .on('data', function (chunk) {
                var state = (100.0 * dataLength / imageManifest.size).toFixed(2);
                dataLength += chunk.length;
                if (state - 10 >= previusState) {
                    console.log(state + "%");
                    previusState = state;
                }
            })
            .on('error', function () {  // done
                console.log('error');
            })
            .on('close', function () {  // done
                console.log('close');
            })
            .on('end', function () {  // done
                console.log('Donwload complete');
                ipfs.pin.add(imageManifest.hash);
                resolve("Download");
            });
    });
}

function loadImage(imageManifest) {
    return new Promise(function (resolve, reject) {
        console.log("Loading docker image...");
        shell.exec('docker load -i ' + imageManifest.path, { silent: true }, function (code, stdout, stderr) {
            if (code !== 0) {
                console.log("stderr:" + stderr);
            } else {
                console.log("Image loaded");
                resolve("OK");
            }
        });
    });
}

function runImage(manifest) {
    return new Promise(function (resolve, reject) {
        var opts = manifest.image.docker_opts || "";

        shell.exec('docker rm -f $(docker ps -f name=dnp-' + manifest.name+' -q) >/dev/null 2>&1')

        shell.exec('docker run -d --restart always --network=dappnode_network --dns=10.17.0.2 ' + opts + ' --name dnp-' + manifest.name + ' ' + manifest.image.name + ":" + manifest.image.version, { async: true });
        console.log("Image started");
        resolve("OK");
    });
}
