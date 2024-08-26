#!/bin/bash

docker compose -f docker-compose.yml -f test/docker-compose.yml up -d

sleep 3

curl -v -d '{"jsonrpc":"2.0","id":"id","method":"fetchDnpRequest","params":[{"id":"QmWnop9s3EFAcA8FSRRVAFwYzLKFwiBjPxCYax7BCkArfu"}]}' -H 'Content-Type: application/json' localhost:8000/rpc

docker-compose down --timeout 0 --volumes

# # Prepare test
# ##############

# cp -r build $DAPPNODE_DIR
# cp -r test/* $DAPPNODE_DIR
# mkdir -p $DAPPNODE_DIR/.git && cp -r .git/* $DAPPNODE_DIR/.git
# cp dappnode_package.json $DAPPNODE_DIR

# docker compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml build
# # Run test
# ##########
# docker compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml up -d

# # Print state for debugging
# docker ps -a

# # Install git and mocha
# docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk update
# docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth apk add git python python-dev build-base
# docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth yarn add -D mocha chai ts-node typescript
# # Run integration tests
# docker exec -it DAppNodeCore-dappmanager.dnp.dappnode.eth yarn test:int
