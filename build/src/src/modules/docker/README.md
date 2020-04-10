# Docker module

## API reference

The structure of the command is as follows:

```
docker-compose up -> docker.compose.up
docker volume rm -> docker.volume.rm
```

Currently it doesn't support all methods in the CLI of docker and docker-compose but only those methods used within this application. The detailed documentation of each method can be found in `./Docker.js`

```
docker.compose.up
docker.compose.down
docker.compose.start
docker.compose.stop
docker.compose.rm
docker.compose.rm_up
docker.compose.restart
docker.compose.logs
docker.compose.ps
docker.volume.rm
docker.load
docker.log
docker.status
docker.openPort
docker.closePort
docker.isUpnpAvailable
```

### Setup

```javascript
const docker = import 'modules/docker'
```

```javascript
const DOCKERCOMPOSE_PATH = "DNCORE/docker-compose-admin.yml";
const options = {
  timeout: 0
};
await docker.compose.down(DOCKERCOMPOSE_PATH, options);
```

## Implementation

It basically wraps the shelljs library. Another approach is to use the `docker-remote-api` but direct commands offer more flexibility for some necessary custom usecases. Each method is responsible for creating the command string and stringifying the options into flags.
