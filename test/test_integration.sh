#!/bin/bash

DAPPNODE_DIR="test_build"
docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml up -d

sleep 30

docker logs DAppNodeCore-dappmanager.dnp.dappnode.eth
docker logs DAppNodeCore-ipfs.dnp.dappnode.eth

# Print state for debugging
docker network ls
docker ps -a

# Install git and mocha
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk update
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk add git python python-dev build-base
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth yarn add mocha chai
# Run integration tests
docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth yarn test:int