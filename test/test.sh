#!/bin/bash

DAPPNODE_DIR="test_build"
docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml up -d

sleep 60
docker logs DAppNodeCore-dappmanager.dnp.dappnode.eth

# docker-compose -f ${DAPPNODE_DIR}/docker-compose-test.yml build
docker network ls
docker ps -a
# docker-compose -f ${DAPPNODE_DIR}/docker-compose-test.yml run test