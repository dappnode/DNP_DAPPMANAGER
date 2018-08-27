const fs = require('fs');
const getPath = require('utils/getPath');
const validate = require('utils/validate');
const dockerList = require('modules/dockerList');
const docker = require('modules/docker');
const params = require('params');


async function restartPatch(IMAGE_NAME) {
    if (!IMAGE_NAME.includes(':')) {
        let dnpList = await dockerList.listContainers();
        let container = dnpList.find((c) => c.name.includes(IMAGE_NAME));
        let version = container.version;
        IMAGE_NAME += (':' + version);
    }

    const DOCKERCOMPOSE_RESTART_PATH = getPath.dockerCompose(
        'restart.dnp.dappnode.eth',
        params,
        true
    );
    const PATH_LOCAL = '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml';
    const PATH_REMOTE = '/usr/src/app/DNCORE/docker-compose-dappmanager.yml';
    const DOCKERCOMPOSE_DATA = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: ${IMAGE_NAME}
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '${PATH_LOCAL}:${PATH_REMOTE}'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f ${PATH_REMOTE} up -d`;

    validate.path(DOCKERCOMPOSE_RESTART_PATH);
    await fs.writeFileSync(DOCKERCOMPOSE_RESTART_PATH, DOCKERCOMPOSE_DATA);
    await docker.compose.up(DOCKERCOMPOSE_RESTART_PATH);
}

module.exports = restartPatch;
