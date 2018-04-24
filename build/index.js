'use strict';
const ipfsAPI = require('ipfs-api');
const fs = require('fs');
const shell = require('shelljs');
const IPFS = process.env.IPFS_REDIRECT || "my.ipfs.dnp.dappnode.eth";
const ipfs = ipfsAPI(IPFS, '5001', { protocol: 'http' });
const validator = require('validator');
const apm = require('./apm');
const autobahn = require('autobahn');
const yaml = require('yamljs');

var connection = new autobahn.Connection({ url: 'ws://my.wamp.dnp.dappnode.eth:8080/ws', realm: 'realm1' });
var session;

const TMP_REPO_DIR = "./tmp_dnp_repo/";
const REPO_DIR = "./dnp_repo/";

connection.onopen = function(_session) {
    session = _session;
    session.register('installPackage.installer.dnp.dappnode.eth', installPackage);
};

connection.open();

//install(["QmWhzrpqcrR5N4xB6nR5iX9q3TyN5LUMxBLHdMedquR8nr"]);
//getDNPInstalled();
/*
async function getDNPInstalled() {
    var list = shell.find('./repo/').filter(function(file) { return file.match(/dappnode_package\.json$/); });
    var dnp_index = [];
    list.forEach(function(value, index, _arr) {
        console.log(index + ": " + value);
        var dpn = JSON.parse(fs.readFileSync(value, 'utf8'));
        var dpn_info = {};
        dpn_info.name = dpn.name;
        dpn_info.version = dpn.version;
        dnp_index.push(dpn_info);

    })
    return (dnp_index)
}
*/

async function installPackage(req) {
    try {
        await install(req);
    } catch (err) {
        return JSON.stringify({
            result: "ERR",
            resultStr: err.message
        });
    }
    return JSON.stringify({
        result: "OK",
        resultStr: "req[0]"
    });
}

function install(req) {
    return new Promise(async function(resolve, reject) {

        console.log('installPackage.installer.dnp.dappnode.eth called: ' + JSON.stringify(req))

        var isDep = req[1] || false;

        try {
            var dnpHash = await get_dnp_hash(req[0]);
            var dpn_manifest = await getAPSManifest(dnpHash);

            // Create de repo dir
            if (!fs.existsSync(TMP_REPO_DIR + dpn_manifest.name)) {
                shell.mkdir('-p', TMP_REPO_DIR + dpn_manifest.name);
            }

            await writeFileToRepo(dpn_manifest, 'dappnode_package.json', JSON.stringify(dpn_manifest, null, 2));
            await resolveDependencies(dpn_manifest.dependencies);
            await generateDockerCompose(dpn_manifest);
            await hashToFile(dpn_manifest);
            //if (!isDep) {
            //    await buildRepoTree();
            //}

            await loadImage(dpn_manifest);
            await runImage(dpn_manifest);

        } catch (err) {
            return reject(err);
        }

        resolve();


        /*
        console.log("Loading image...");
        await loadImage(dpn_manifest);

        console.log("Starting image...");
        await runImage(dpn_manifest)

        console.log("Installed and running!");
        */
    });

}

function buildRepoTree() {
    return new Promise(function(resolve, reject) {

        var list = shell.find(TMP_REPO_DIR).filter(function(file) {
            return file.match(/dappnode_package\.json$/);
        });

        var dnp_index = [];
        list.forEach(function(value, index, _arr) {
            console.log(index + ": " + value);
            var dpn = JSON.parse(fs.readFileSync(value, 'utf8'));
            var dpn_info = {};
            dpn_info.name = dpn.name;
            dpn_info.version = dpn.version;
            dnp_index.push(dpn_info);

        })
        return (dnp_index)
    });
}

function get_dnp_hash(dnp_req) {
    return new Promise(function(resolve, reject) {
        var packageName = dnp_req.split("@")[0];
        if (validator.isFQDN(packageName)) {
            apm.getRepoHash(dnp_req).then((repoHash) => {
                if (repoHash != "") {
                    return resolve(repoHash);
                } else {
                    return reject(new Error("A valid hash has not been found for the repo"));
                }
            })
        } else {
            return resolve(packageName);
        }
    });
}

function getAPSManifest(hash) {
    return new Promise(function(resolve, reject) {
        console.log("Reading manifest... " + hash);
        ipfs.files.cat(hash, function(err, file) {
            if (err) {
                return reject(err);
            }
            clearTimeout(timeoutReject);
            ipfs.pin.add(hash);
            return resolve(JSON.parse(file));
        });
        var timeoutReject = setTimeout(function() { return reject(new Error("ipfs cat timeout")) }, 15000);
    });
}

function generateDockerCompose(dpn_manifest) {
    return new Promise(async function(resolve, reject) {

        var name = dpn_manifest.name.replace("/", "_").replace("@", "");

        var dockerCompose = {};
        dockerCompose.version = "3.4"
        dockerCompose.services = {}
        dockerCompose.services[name] = {}
        dockerCompose.services[name].image = dpn_manifest.image.name + ":" + dpn_manifest.image.version
        dockerCompose.services[name].container_name = "DAppNodePackage-" + name
        if(dpn_manifest.image.volumes){
            var external_volumes = {};
            dockerCompose.services[name].volumes = dpn_manifest.image.volumes
            
            //suport for external volumes. it detects external volumes and add
            //a entry for that purpouse
            dpn_manifest.image.volumes.forEach((vol) => {
                if(!vol.startsWith('/') && !vol.startsWith('~')){
                    external_volumes[vol.split(":")[0]] = {};
                }
            });

            dockerCompose.volumes = external_volumes;
        }
        /*
        html:
            external:
                name: dnpnginxproxy_html
        vhost.d:
            external:
                name: dnpnginxproxy_vhost.d
        */
        if(dpn_manifest.image.external_vol) {
            dockerCompose.services[name].volumes = dpn_manifest.image.external_vol
            dpn_manifest.image.external_vol.forEach((vol) => {
                var name = vol.split(":")[0];
                var external = {name};
                dockerCompose[name] = {external};
            });
        }

        if(dpn_manifest.image.ports){
            dockerCompose.services[name].ports = dpn_manifest.image.ports
        }

        // label handling
        if(dpn_manifest.image.labels){
            dockerCompose.services[name].labels = dpn_manifest.image.labels
        }
        dockerCompose.services[name].networks = ["dncore_network"];
        dockerCompose.services[name].dns = '10.17.0.2';
        dockerCompose.networks = {}
        dockerCompose.networks.dncore_network = {}
        dockerCompose.networks.dncore_network.external = true

        try {
            await writeFileToRepo(dpn_manifest, "docker-compose.yml", yaml.stringify(dockerCompose, 4))
        } catch (err) {
            return reject(err);
        }
        return resolve();
    })
}


function writeFileToRepo(dpn_manifest, filename, info) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(TMP_REPO_DIR + dpn_manifest.name + "/" + filename, info, 'utf-8', function(err) {
            if (err) {
                return reject(err)
            }
            return resolve();
        });
    })
}

// TODO
function resolveDependencies(dependencies) {
    return new Promise(async (resolve, reject) => {
        for (var dep in dependencies) {
            if (dependencies.hasOwnProperty(dep)) {
                console.log(dep + " -> " + dependencies[dep]);
                var dep_hash;
                try {
                    await install([dep_hash, true]);
                } catch (err) {
                    return reject(err);
                }
            }
        }
        return resolve();
    });
}

function hashToFile(dpn_manifest) {
    return new Promise(function(resolve, reject) {
        console.log("Getting compress image... "+dpn_manifest.image.hash);
        const rstream = ipfs.files.catReadableStream(dpn_manifest.image.hash);
        var wstream = fs.createWriteStream("./tmp_dnp_repo/" + dpn_manifest.name + "/" + '/' + dpn_manifest.image.path);

        rstream.pipe(wstream, { end: true });
        var dataLength = 0;
        var previusState = 0;
        rstream
            .on('data', function(chunk) {
                var state = (100.0 * dataLength / dpn_manifest.image.size).toFixed(2);
                dataLength += chunk.length;
                if (state - 10 >= previusState) {
                    console.log(state + "%");
                    previusState = state;
                }
            })
            .on('error', function() {  // done
                console.log('error');
            })
            .on('close', function() {  // done
                console.log('close');
            })
            .on('end', function() {  // done
                console.log('Donwload complete');
                ipfs.pin.add(dpn_manifest.image.hash);
                resolve("Download");
            });
    });
}

function loadImage(dpn_manifest) {
    return new Promise(function(resolve, reject) {
        console.log("Loading docker image...");
        console.log('docker load -i ' + "./tmp_dnp_repo/" + dpn_manifest.name + "/" + '/' + dpn_manifest.image.path);
        shell.exec('docker load -i ' + "./tmp_dnp_repo/" + dpn_manifest.name + "/" + '/' + dpn_manifest.image.path, { silent: true }, function(code, stdout, stderr) {
            if (code !== 0) {
                console.log("stderr:" + stderr);
            } else {
                console.log("Image " + dpn_manifest.image.path + " loaded");
                resolve("OK");
            }
        });
    });
}

function runImage(dpn_manifest) {
    return new Promise(function(resolve, reject) {
        var docker_file = 'docker-compose -f ' + "./tmp_dnp_repo/" + dpn_manifest.name + '/docker-compose.yml' + ' up -d' ;
        console.log(docker_file)
        shell.exec(docker_file,
        function(code, stdout, stderr) {
            if (code !== 0) {
                console.log("stderr:" + stderr);
            } else {
                console.log("Image started");
                resolve("OK");
            }
        });
    });
}
