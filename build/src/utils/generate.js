// node modules
const yaml = require('js-yaml')


function dockerCompose(dpn_manifest, params, isCORE = false) {

    // Define docker compose parameters
    const DNS_SERVICE = params.DNS_SERVICE
    const DNP_NETWORK = params.DNP_NETWORK
    const DNP_VERSION_TAG = params.DNP_VERSION_TAG
    const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX
    const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX

    var name = dpn_manifest.name.replace("/", "_").replace("@", "");


    // DOCKER COMPOSE YML - SERVICE
    // ============================
    let service = {}
    if (isCORE) {
      service.image = dpn_manifest.name + ":" + dpn_manifest.version
      service.container_name = CONTAINER_CORE_NAME_PREFIX + name
      service.restart = "always"
    } else {
      service.image = dpn_manifest.image.name + ":" + dpn_manifest.image.version
      service.container_name = CONTAINER_NAME_PREFIX + name
    }

    // Volumes
    service.volumes = [
      ...(dpn_manifest.image.volumes || []),
      ...(dpn_manifest.image.external_vol || [])
    ]

    // Ports
    if(dpn_manifest.image.ports){
        service.ports = dpn_manifest.image.ports
    }

    // Support for environment variables
    if(dpn_manifest.image.environment){
        service.env_file = [name + ".env"]
    }

    // Networks
    if (isCORE) {
      service.networks = {
        network: {
          ipv4_address: dpn_manifest.image.ipv4_address
        }
      }
    } else {
      service.networks = [DNP_NETWORK]
    }

    // DNS
    service.dns = DNS_SERVICE

    // label handling
    if(dpn_manifest.image.labels){
      dpn_manifest.image.labels.map(label => {
        service.labels.push(label)
      })
    }


    // DOCKER COMPOSE YML - VOLUMES
    // ============================
    let volumes = {}
    // Regular volumes
    if(dpn_manifest.image.volumes) {
      dpn_manifest.image.volumes.map(vol => {
        // Make sure it's a named volume
        if(!vol.startsWith('/') && !vol.startsWith('~')){
          const volName = vol.split(":")[0]
          volumes[volName] = {}
        }
      });
    }
    // External volumes
    if(dpn_manifest.image.external_vol) {
      dpn_manifest.image.external_vol.map(vol => {
        const volName = vol.split(":")[0]
        volumes[volName] = {
          external: {
            "name": volName
          }
        }
      });
    }


    // DOCKER COMPOSE YML - NETWORKS
    // ============================
    let networks = {}
    if (isCORE && dpn_manifest.image.subnet) {
      networks = {
        network: {
          driver: 'bridge',
          ipam: {
            config: [ { subnet: dpn_manifest.image.subnet } ]
          }
        }
      }

    } else {
      networks[DNP_NETWORK] = {}
      networks[DNP_NETWORK].external = true
    }

    const dockerCompose = {
      version: '3.4',
      services: {
        [name]: service
      },
      volumes,
      networks
    }

    return yaml.dump(dockerCompose, {
      indent: 4
    })

}


function manifest (dnpManifest) {
    return JSON.stringify(dnpManifest, null, 2)
}


module.exports = {
  dockerCompose,
  manifest
}
