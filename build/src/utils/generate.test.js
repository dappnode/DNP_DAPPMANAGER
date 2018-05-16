const assert = require('assert')
const sinon = require('sinon')
const chai = require('chai')
const expect = require('chai').expect

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
        labels:
            - dnp_version=0.0.1
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
`

describe('generate, utils', function() {

  const params = {
    DNP_VERSION_TAG: "dnp_version",
    DNS_SERVICE: "172.33.1.2",
    DNP_NETWORK: "dncore_network",
    CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  }

  describe('generate docker-compose.yml file', function() {

    const input = {
      key: 'value'
    }
    const expected_result = '{\n  "key": "value"\n}'

    it('should generate the expected result', () => {
      generate.dockerCompose(manifest, params)
        .should.equal(dockerCompose)
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
