const chai = require('chai');
const parse = require('./parse');
const validate = require('./validate');
const fs = require('fs');

chai.should();

const DOCKERCOMPOSE_PATH = './test/docker-compose-test.yml';
const DOCKERCOMPOSE_PATH2 = './test/docker-compose-test2.yml';
const dockerComposeData = (`
version: '3.4'
services:
    ipfs.dnp.dappnode.eth:
        image: 'ipfs.dnp.dappnode.eth:0.1.0'
        container_name: DAppNodeCore-ipfs.dnp.dappnode.eth
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
`).trim();

const dockerComposeData2 = (`
version: '3.4'
services:
    ipfs.dnp.dappnode.eth:
        image: 'ipfs.dnp.dappnode.eth:0.1.0'
        container_name: DAppNodeCore-ipfs.dnp.dappnode.eth
        restart: always
        volumes:
            - 'export:/export'
            - 'data:/data/ipfs'
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
`).trim();

describe('Util: parse', function() {
  describe('docker-compose parsing utils', function() {
    before(() => {
      validate.path(DOCKERCOMPOSE_PATH);
      fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeData);
      validate.path(DOCKERCOMPOSE_PATH2);
      fs.writeFileSync(DOCKERCOMPOSE_PATH2, dockerComposeData2);
    });

    it('should parse ports', () => {
      const ports = parse.dockerComposePorts(DOCKERCOMPOSE_PATH);
      ports
        .should.deep.equal(['4001', '4002']);
    });

    it('should parse ports when there are non', () => {
      const ports = parse.dockerComposePorts(DOCKERCOMPOSE_PATH2);
      ports
        .should.deep.equal([]);
    });


    it('should parse container_name', () => {
      const ports = parse.containerName(DOCKERCOMPOSE_PATH);
      ports
        .should.deep.equal('DAppNodeCore-ipfs.dnp.dappnode.eth');
    });

    it('should parse the service volumes', () => {
      const ports = parse.serviceVolumes(DOCKERCOMPOSE_PATH);
      ports
        .should.deep.equal(['export', 'data']);
    });
  });

  describe('parse and stringify envs', function() {
    const envs = {
      VAR1: 'VALUE1',
      VAR2: 'VALUE2',
    };
    const envString = 'VAR1=VALUE1\nVAR2=VALUE2';

    it('should stringify an envs object', () => {
      parse.stringifyEnvs(envs)
        .should.equal(envString);
    });

    it('should parse an env string', () => {
      parse.envFile(envString)
        .should.deep.equal(envs);
    });
  });

  describe('parse Package request', function() {
    it('should parse a package request', () => {
      parse.packageReq('package_name@version')
        .should.deep.equal({
          name: 'package_name',
          ver: 'version',
          req: 'package_name@version',
        });
    });

    it('should add latest to verionless requests', () => {
      parse.packageReq('package_name')
        .should.deep.equal({
          name: 'package_name',
          ver: 'latest',
          req: 'package_name@latest',
        });
    });
  });
});
