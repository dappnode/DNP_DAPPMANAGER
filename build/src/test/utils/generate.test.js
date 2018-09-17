const chai = require('chai');
const params = require('params');

chai.should();

const generate = require('utils/generate');

const manifest = {
  'name': 'letsencrypt-nginx.dnp.dappnode.eth',
  'version': '0.0.1',
  'description': 'letsencrypt-nginx-proxy-companion version for DAppNode',
  'image': {
    'path': 'letsencrypt-nginx.dnp.dappnode.eth_0.0.1.tar.xz',
    'hash': 'Qmbii5osjvJw9CmiRe6huDCb3nabjiyMhA4SNaeubtAAw2',
    'size': 23781268,
    'volumes': [
      '~/certs:/etc/nginx/certs:rw',
      '/var/run/docker.sock:/var/run/docker.sock:ro',
    ],
    'external_vol': [
      'nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d',
      'nginxproxydnpdappnodeeth_html:/usr/share/nginx/html',
    ],
    'restart': 'always',
    'name': 'letsencrypt-nginx.dnp.dappnode.eth',
    'version': '0.0.1',
  },
  'author': 'Eduardo Antuña Díez (eduadiez)',
  'license': 'MIT',
  'dependencies': {
    'nginx-proxy.dnp.dappnode.eth': 'latest',
  },
};

const dockerCompose = `version: '3.4'
services:
    letsencrypt-nginx.dnp.dappnode.eth:
        container_name: DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth
        image: 'letsencrypt-nginx.dnp.dappnode.eth:0.0.1'
        restart: always
        volumes:
            - '~/certs:/etc/nginx/certs:rw'
            - '/var/run/docker.sock:/var/run/docker.sock:ro'
            - 'nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d'
            - 'nginxproxydnpdappnodeeth_html:/usr/share/nginx/html'
        networks:
            - dncore_network
        dns: 172.33.1.2
volumes:
    nginxproxydnpdappnodeeth_vhost.d:
        external:
            name: nginxproxydnpdappnodeeth_vhost.d
    nginxproxydnpdappnodeeth_html:
        external:
            name: nginxproxydnpdappnodeeth_html
networks:
    dncore_network:
        external: true
`;

const manifestCORE = {
    'name': 'bind.dnp.dappnode.eth',
    'version': '0.1.0',
    'description': 'Dappnode package responsible for providing DNS resolution',
    'avatar': '/ipfs/QmXFGDiNDxBVZHLH5MgEstZwHFb2J3CWHmPKmc45zQWv1z',
    'type': 'dncore',
    'image': {
        'path': 'bind.dnp.dappnode.eth_0.1.0.tar.xz',
        'hash': '/ipfs/QmTz1c5RWT7qyKBhnv4tUbPcMarpTSsDd8r6GXG6LD176j',
        'size': 3235875,
        'volumes': [
            'dnp_bind_data:/etc/bind',
        ],
        'restart': 'always',
        'subnet': '172.33.0.0/16',
        'ipv4_address': '172.33.1.2',
    },
};

const dockerComposeCORE = `version: '3.4'
services:
    bind.dnp.dappnode.eth:
        container_name: DAppNodeCore-bind.dnp.dappnode.eth
        image: 'bind.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - 'dnp_bind_data:/etc/bind'
        networks:
            network:
                ipv4_address: 172.33.1.2
        dns: 172.33.1.2
volumes:
    dnp_bind_data: {}
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`;

const ipfs = {
  manifest: {
    name: 'ipfs.dnp.dappnode.eth',
    version: '0.1.0',
    description: 'Dappnode package responsible for providing IPFS connectivity (go-ipfs v0.4.15)',
    avatar: '/ipfs/QmViXy8BVb8dQ7J9jLK626kcB5Tz2pvvKE43KHo8RNDXxL',
    type: 'dncore',
    image: {
      path: 'ipfs.dnp.dappnode.eth_0.1.0.tar.xz',
      hash: '/ipfs/QmcVHo2T6qVCZHGPuVJumcDzHyyrGTRHPe3zJ55jitSt7C',
      size: 9131772,
      volumes: [
        'export:/export',
        'data:/data/ipfs',
      ],
      ports: [
        '4001:4001',
        '4002:4002/udp',
      ],
      restart: 'always',
      subnet: '172.33.0.0/16',
      ipv4_address: '172.33.1.5',
    },
    author: 'Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)',
    keywords: [
      'DAppNodeCore',
      'IPFS',
    ],
    homepage: 'https://github.com/dappnode/DNP_IPFS#readme',
    repository: {
      type: 'git',
      url: 'https://github.com/dappnode/DNP_IPFS',
    },
    bugs: {
      url: 'https://github.com/dappnode/DNP_IPFS/issues',
    },
    license: 'GPL-3.0',
  },
  dc: `version: '3.4'
services:
    ipfs.dnp.dappnode.eth:
        container_name: DAppNodeCore-ipfs.dnp.dappnode.eth
        image: 'ipfs.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - 'export:/export'
            - 'data:/data/ipfs'
        ports:
            - '4001:4001'
            - '4002:4002/udp'
        networks:
            network:
                ipv4_address: 172.33.1.5
        dns: 172.33.1.2
volumes:
    export: {}
    data: {}
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`,
};

const vpn = {
  manifest: {
    'name': 'vpn.dnp.dappnode.eth',
    'version': '0.1.0',
    'description': 'Dappnode package responsible for providing the VPN (L2TP/IPSec) connection',
    'avatar': '/ipfs/QmWwMb3XhuCH6JnCF6m6EQzA4mW9pHHtg7rqAfhDr2ofi8',
    'type': 'dncore',
    'image': {
      'path': 'vpn.dnp.dappnode.eth_0.1.0.tar.xz',
      'hash': '/ipfs/QmXvWFs6Re4Bp42gYa4whQE9yKSJbi3g9PETaTUnypQKm5',
      'size': 31516488,
      'volumes': [
        '/etc/hostname:/etc/vpnname:ro',
        '/lib/modules:/lib/modules:ro',
      ],
      'ports': [
        '4500:4500/udp',
        '500:500/udp',
      ],
      'environment': [
        'VPN_DNS_SRV1=172.33.1.2',
        'VPN_DNS_SRV2=8.8.8.8',
      ],
      'privileged': 'true',
      'restart': 'always',
      'subnet': '172.33.0.0/16',
      'ipv4_address': '172.33.1.4',
    },
    'author': 'Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)',
    'contributors': [
      'DAppLion <dapplion@giveth.io> (https://github.com/dapplion)',
      'Alex Floyd <alex@giveth.io> (https://github.com/mex20)',
    ],
    'keywords': [
      'DAppNodeCore',
      'VPN',
      'IPSec',
      'L2TP',
    ],
    'homepage': 'https://github.com/dappnode/DNP_VPN#readme',
    'repository': {
      'type': 'git',
      'url': 'https://github.com/dappnode/DNP_VPN',
    },
    'bugs': {
      'url': 'https://github.com/dappnode/DNP_VPN/issues',
    },
    'license': 'GPL-3.0',
  },
  dc: `version: '3.4'
services:
    vpn.dnp.dappnode.eth:
        container_name: DAppNodeCore-vpn.dnp.dappnode.eth
        privileged: true
        image: 'vpn.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - '/etc/hostname:/etc/vpnname:ro'
            - '/lib/modules:/lib/modules:ro'
        ports:
            - '4500:4500/udp'
            - '500:500/udp'
        env_file:
            - vpn.dnp.dappnode.eth.env
        networks:
            network:
                ipv4_address: 172.33.1.4
        dns: 172.33.1.2
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`,
};

const mysterium = {
    manifest: {
        'name': 'Mysterium',
        'version': '',
        'description': '',
        'avatar': '',
        'type': '',
        'image': {
          'path': '',
          'hash': '',
          'size': '',
          'cap_add': [
            'SYS_ADMIN',
          ],
          'cap_drop': [
            'NET_ADMIN',
          ],
          'network_mode': 'host',
          'command': '--command',
        },
      },
    dc: `version: '3.4'
services:
    Mysterium:
        container_name: DAppNodePackage-Mysterium
        image: 'Mysterium:'
        volumes: []
        networks:
            - dncore_network
        dns: 172.33.1.2
        cap_add:
            - SYS_ADMIN
        cap_drop:
            - NET_ADMIN
        network_mode: host
        command: '--command'
networks:
    dncore_network:
        external: true
`,
};

const emptyArrays = {
    manifest: {
        'name': 'EmptyArray',
        'version': '',
        'description': '',
        'avatar': '',
        'type': '',
        'image': {
          'path': '',
          'hash': '',
          'size': '',
          'volumes': [
            '',
          ],
          'ports': [
            '',
          ],
          'command': '--command',
        },
      },
    dc: `version: '3.4'
services:
    EmptyArray:
        container_name: DAppNodePackage-EmptyArray
        image: 'EmptyArray:'
        volumes:
            - ''
        ports:
            - ''
        networks:
            - dncore_network
        dns: 172.33.1.2
        command: '--command'
volumes:
    '': {}
networks:
    dncore_network:
        external: true
`,
};

describe('generate, utils', function() {
  describe('generate docker-compose.yml file', function() {
    // Non-CORE
    it('should generate the expected result', () => {
      generate.dockerCompose(manifest, params)
        .should.equal(dockerCompose);
    });

    // CORE packages
    it('should generate the expected result', () => {
      const isCORE = true;
      generate.dockerCompose(manifestCORE, params, isCORE)
        .should.equal(dockerComposeCORE);
    });

    // CORE package - IPFS
    it('should generate the expected docker-compose of IPFS', () => {
      const isCORE = true;
      generate.dockerCompose(ipfs.manifest, params, isCORE)
        .should.equal(ipfs.dc);
    });

    // CORE package - VPN
    it('should generate the expected docker-compose of VPN', () => {
      const isCORE = true;
      generate.dockerCompose(vpn.manifest, params, isCORE)
        .should.equal(vpn.dc);
    });

    // Mysterium package
    it('should generate the expected docker-compose of Mysterium', () => {
        generate.dockerCompose(mysterium.manifest, params)
          .should.equal(mysterium.dc);
    });

    // EmptyArrays package
    it('should generate the expected docker-compose of EmptyArray', () => {
        generate.dockerCompose(emptyArrays.manifest, params)
          .should.equal(emptyArrays.dc);
    });
  });

  describe('generate a manifest file', function() {
    const input = {
      key: 'value',
    };
    const expectedResult = '{\n  "key": "value"\n}';

    it('should generate the expected result', () => {
      generate.manifest(input)
        .should.equal(expectedResult);
    });
  });
});
