const chai = require('chai')
const expect = require('chai').expect
const sinon = require('sinon')
const createRestartPatch = require('./createRestartPatch')
const getPath = require('./getPath')
const fs = require('fs')


describe('Util: createRestartPatch', () => {

  let docker_compose_up_arg;
  const docker = {
    compose: {
      up: async (arg) => {
        docker_compose_up_arg = arg
      }
    }
  }
  const params = {
    DNCORE_DIR: 'DNCORE',
    DOCKERCOMPOSE_NAME: 'docker-compose.yml'
  }
  const IMAGE_NAME = 'dappmanager.tar.xz:0.0.9'
  const DOCKERCOMPOSE_RESTART_PATH = getPath.DOCKERCOMPOSE('restart.dnp.dappnode.eth', params, true)

  let restartPatch

  it('Should build without crashing', () => {
    restartPatch = createRestartPatch(params, docker)
  })

  it('Should call docker.compose.up with the correct arguments', () => {
    restartPatch(IMAGE_NAME).then(() => {
      expect(docker_compose_up_arg)
        .to.be.equal(DOCKERCOMPOSE_RESTART_PATH)
    })
  })

  it('Should generate a the correct docker-compose restart', () => {
    const dc = fs.readFileSync(DOCKERCOMPOSE_RESTART_PATH, 'utf8')
    const expected_dc = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: dappmanager.tar.xz:0.0.9
        container_name: DAppNodeCore-restart.dnp.dappnode.eth
        volumes:
            - '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml:/usr/src/app/DNCORE/docker-compose-dappmanager.yml'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml up -d`
    expect(dc).to.equal(expected_dc)
    fs.unlinkSync(DOCKERCOMPOSE_RESTART_PATH)
  })


});
