const assert = require('assert')
const sinon = require('sinon')
const chai = require('chai')
const expect = require('chai').expect
const params = require('../params')
const fs = require('fs')

chai.should();



const generate = require('./generate')

const manifest = {
  "name": "letsencrypt-nginx.dnp.dappnode.eth",
  "version": "0.0.1",
  "description": "letsencrypt-nginx-proxy-companion version for DAppNode",
  "image": {
    "path": "letsencrypt-nginx.dnp.dappnode.eth_0.0.1.tar.xz",
    "hash": "Qmbii5osjvJw9CmiRe6huDCb3nabjiyMhA4SNaeubtAAw2",
    "size": 23781268,
    "volumes": [
      "~/certs:/etc/nginx/certs:rw",
      "/var/run/docker.sock:/var/run/docker.sock:ro"
    ],
    "external_vol": [
      "nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d",
      "nginxproxydnpdappnodeeth_html:/usr/share/nginx/html"
    ],
    "name": "letsencrypt-nginx.dnp.dappnode.eth",
    "version": "0.0.1"
  },
  "author": "Eduardo Antuña Díez (eduadiez)",
  "license": "MIT",
  "dependencies": {
    "nginx-proxy.dnp.dappnode.eth": "latest"
  }
}

const dockerCompose = `version: '3.4'
services:
    letsencrypt-nginx.dnp.dappnode.eth:
        image: 'letsencrypt-nginx.dnp.dappnode.eth:0.0.1'
        container_name: DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth
        volumes:
            - '~/certs:/etc/nginx/certs:rw'
            - '/var/run/docker.sock:/var/run/docker.sock:ro'
            - 'nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d'
            - 'nginxproxydnpdappnodeeth_html:/usr/share/nginx/html'
        networks:
            - dncore_network
        dns: 172.33.1.2
        labels:
            - dnp_version=0.0.1
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
`

const manifestCORE = {
    "name": "bind.dnp.dappnode.eth",
    "version": "0.1.0",
    "description": "Dappnode package responsible for providing DNS resolution",
    "avatar": "/ipfs/QmXFGDiNDxBVZHLH5MgEstZwHFb2J3CWHmPKmc45zQWv1z",
    "type": "dncore",
    "image": {
        "path": "bind.dnp.dappnode.eth_0.1.0.tar.xz",
        "hash": "/ipfs/QmTz1c5RWT7qyKBhnv4tUbPcMarpTSsDd8r6GXG6LD176j",
        "size": 3235875,
        "volumes": [
            "dnp_bind_data:/etc/bind"
        ],
        "restart": "always",
        "subnet": "172.33.0.0/16",
        "ipv4_address": "172.33.1.2"
    }
}

const dockerComposeCORE = `version: '3.4'
services:
    bind.dnp.dappnode.eth:
        image: 'bind.dnp.dappnode.eth:0.1.0'
        container_name: DAppNodeCore-bind.dnp.dappnode.eth
        restart: always
        volumes:
            - 'dnp_bind_data:/etc/bind'
        networks:
            network:
                ipv4_address: 172.33.1.2
        dns: 172.33.1.2
        labels:
            - dnp_version=0.1.0
volumes:
    dnp_bind_data: {}
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`

describe('generate, utils', function() {

  describe('generate docker-compose.yml file', function() {

    // Non-CORE
    it('should generate the expected result', () => {
      generate.dockerCompose(manifest, params)
        .should.equal(dockerCompose)
    });

    // CORE packages
    it('should generate the expected result', () => {
      const isCORE = true
      generate.dockerCompose(manifestCORE, params, isCORE)
        .should.equal(dockerComposeCORE)
    });

  });

  describe('generate a manifest file', function() {

    const input = {
      key: 'value'
    }
    const expected_result = '{\n  "key": "value"\n}'

    it('should generate the expected result', () => {
      generate.manifest(input)
        .should.equal(expected_result)
    });
  });

});
