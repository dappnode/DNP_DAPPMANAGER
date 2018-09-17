const yaml = require('js-yaml');

/*
 * Generates files needed by DNPs
 * - dockerCompose
 * - manifest
*/

function dockerCompose(dpnManifest, params, isCORE = false, fromIpfs = false) {
    // Define docker compose parameters
    const DNS_SERVICE = params.DNS_SERVICE;
    const DNP_NETWORK = params.DNP_NETWORK;
    const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
    const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;

    const PACKAGE_NAME = dpnManifest.name.replace('/', '_').replace('@', '');


    // DOCKER COMPOSE YML - SERVICE
    // ============================
    let service = {};
    if (isCORE) {
      service.container_name = CONTAINER_CORE_NAME_PREFIX + PACKAGE_NAME;
      if (dpnManifest.image.privileged) {
        service.privileged = true;
      }
    } else {
      service.container_name = CONTAINER_NAME_PREFIX + PACKAGE_NAME;
    }

    // Image name
    service.image = dpnManifest.name + ':' + (fromIpfs ? fromIpfs : dpnManifest.version);
    if (dpnManifest.image.restart) {
      service.restart = dpnManifest.image.restart;
    }

    // Volumes
    service.volumes = [
      ...(dpnManifest.image.volumes || []),
      ...(dpnManifest.image.external_vol || []),
    ];

    // Ports
    if (dpnManifest.image.ports) {
        service.ports = dpnManifest.image.ports;
    }

    // Support for environment variables
    if (dpnManifest.image.environment) {
      service.env_file = [PACKAGE_NAME + '.env'];
    }

    // Networks
    if (isCORE) {
      if (dpnManifest.image.ipv4_address) {
        service.networks = {
          network: {
            ipv4_address: dpnManifest.image.ipv4_address,
          },
        };
      }
    } else {
      service.networks = [DNP_NETWORK];
    }

    // DNS
    service.dns = DNS_SERVICE;

    // label handling
    if (dpnManifest.image.labels) {
      service.labels = service.labels || [];
      dpnManifest.image.labels.map((label) => {
        service.labels.push(label);
      });
    }
    if (dpnManifest.origin) {
      service.labels = service.labels || [];
      service.labels.push('origin='+dpnManifest.origin);
    }

    // Extra features
    if (dpnManifest.image.cap_add) service.cap_add = dpnManifest.image.cap_add;
    if (dpnManifest.image.cap_drop) service.cap_drop = dpnManifest.image.cap_drop;
    if (dpnManifest.image.network_mode) service.network_mode = dpnManifest.image.network_mode;
    if (dpnManifest.image.command) service.command = dpnManifest.image.command;


    // DOCKER COMPOSE YML - VOLUMES
    // ============================
    let volumes = {};
    // Regular volumes
    if (dpnManifest.image.volumes) {
      dpnManifest.image.volumes.map((vol) => {
        // Make sure it's a named volume
        if (!vol.startsWith('/') && !vol.startsWith('~')) {
          const volName = vol.split(':')[0];
          volumes[volName] = {};
        }
      });
    }
    // External volumes
    if (dpnManifest.image.external_vol) {
      dpnManifest.image.external_vol.map((vol) => {
        const volName = vol.split(':')[0];
        volumes[volName] = {
          external: {
            'name': volName,
          },
        };
      });
    }


    // DOCKER COMPOSE YML - NETWORKS
    // ============================
    let networks = {};
    if (isCORE && dpnManifest.image.subnet) {
      networks = {
        network: {
          driver: 'bridge',
          ipam: {
            config: [{subnet: dpnManifest.image.subnet}],
          },
        },
      };
    } else {
      networks[DNP_NETWORK] = {};
      networks[DNP_NETWORK].external = true;
    }

    let dockerCompose = {
      version: '3.4',
      services: {
        [PACKAGE_NAME]: service,
      },
    };
    if (Object.getOwnPropertyNames(volumes).length) dockerCompose.volumes = volumes;
    if (Object.getOwnPropertyNames(networks).length) dockerCompose.networks = networks;

    return yaml.dump(dockerCompose, {
      indent: 4,
    });
}


function manifest(dnpManifest) {
    return JSON.stringify(dnpManifest, null, 2);
}


module.exports = {
  dockerCompose,
  manifest,
};
