#!/bin/bash

DAPPNODE_DIR="test_build"
docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml up -d

sleep 60
docker logs DAppNodeCore-dappmanager.dnp.dappnode.eth

# Print state for debugging
docker network ls
docker ps -a

# Install git and mocha
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk update
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk add git
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth npm i mocha
# Run integration tests
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth npm run test.int