// node modules
const yaml = require('yamljs')

// dedicated modules
const params = require('../params')

// Define docker compose parameters
const DNS_SERVICE = params.DNS_SERVICE
const DNP_NETWORK = params.DNP_NETWORK
const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX

function DockerCompose(dpn_manifest) {

    var name = dpn_manifest.name.replace("/", "_").replace("@", "");

    var dockerCompose = {};
    dockerCompose.version = "3.4"
    dockerCompose.services = {}
    dockerCompose.services[name] = {}
    dockerCompose.services[name].image = dpn_manifest.image.name + ":" + dpn_manifest.image.version
    dockerCompose.services[name].container_name = CONTAINER_NAME_PREFIX + name
    dockerCompose.services[name].labels = [params.DNP_VERSION_TAG+"="+dpn_manifest.version]

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
        var external_volumes = {};
        if(!dockerCompose.services[name].volumes){
            dockerCompose.services[name].volumes = [];
        }
        dpn_manifest.image.external_vol.forEach((vol) => {
            dockerCompose.services[name].volumes.push(vol);
            var vol_name = vol.split(":")[0];
            var external = {"name": vol_name };
            external_volumes[vol_name] = {external};
            dockerCompose.volumes = external_volumes;
        });
    }

    if(dpn_manifest.image.ports){
        dockerCompose.services[name].ports = dpn_manifest.image.ports
    }

    // label handling
    if(dpn_manifest.image.labels){
      dpn_manifest.image.labels.forEach(function(label){
        dockerCompose.services[name].labels.push(label)
      })
      console.log(dockerCompose.services[name].labels)
    }

    // Support for environment variables
    if(dpn_manifest.image.environment){
        dockerCompose.services[name].env_file = [name + '.env']
    }
    dockerCompose.services[name].networks = [DNP_NETWORK]
    dockerCompose.services[name].dns = DNS_SERVICE
    dockerCompose.networks = {}
    dockerCompose.networks[DNP_NETWORK] = {}
    dockerCompose.networks[DNP_NETWORK].external = true

    return yaml.stringify(dockerCompose, 4)

}


function Manifest(dnpManifest) {
  return JSON.stringify(dnpManifest, null, 2)
}


module.exports = {
  DockerCompose,
  Manifest
}
