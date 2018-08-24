#!/bin/bash

# Beware in the test docker-compose that travis 
# will do a docker-compose up in a the directory DNPIPFS
# Therefore the name of the network has to be dnpbind_network

# Install bind
##############

DAPPNODE_DIR="test_build"
mkdir $DAPPNODE_DIR

export BIND_VERSION="0.1.5"
export IPFS_VERSION="0.1.3"
BIND_URL="https://github.com/dappnode/DNP_BIND/releases/download/v${BIND_VERSION}/bind.dnp.dappnode.eth_${BIND_VERSION}.tar.xz"
IPFS_URL="https://github.com/dappnode/DNP_IPFS/releases/download/v${IPFS_VERSION}/ipfs.dnp.dappnode.eth_${IPFS_VERSION}.tar.xz"
BIND_YML="https://github.com/dappnode/DNP_BIND/releases/download/v${BIND_VERSION}/docker-compose-bind.yml"
IPFS_YML="https://github.com/dappnode/DNP_IPFS/releases/download/v${IPFS_VERSION}/docker-compose-ipfs.yml"
BIND_YML_FILE="${DAPPNODE_DIR}/docker-compose-bind.yml"
IPFS_YML_FILE="${DAPPNODE_DIR}/docker-compose-ipfs.yml"
BIND_FILE="${DAPPNODE_DIR}/bind.dnp.dappnode.eth_${BIND_VERSION}.tar.xz"
IPFS_FILE="${DAPPNODE_DIR}/ipfs.dnp.dappnode.eth_${IPFS_VERSION}.tar.xz"

wget -O $BIND_FILE $BIND_URL
wget -O $BIND_YML_FILE $BIND_YML
wget -O $IPFS_FILE $IPFS_URL
wget -O $IPFS_YML_FILE $IPFS_YML

docker load -i $BIND_FILE
docker load -i $IPFS_FILE

# Delete build line frome yml
sed -i '/build: \.\/build/d' $BIND_YML_FILE
sed -i '/build: \.\/build/d' $IPFS_YML_FILE

# Start bind and ipfs
docker-compose -f $BIND_YML_FILE up -d
docker-compose -f $IPFS_YML_FILE up -d

# Prepare test
##############

cp -r build $DAPPNODE_DIR
cp docker-compose-dappmanager.yml $DAPPNODE_DIR
cp -r test/* $DAPPNODE_DIR

docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml build
docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml up -d

sleep 60
docker logs DAppNodeCore-dappmanager.dnp.dappnode.eth

# docker-compose -f ${DAPPNODE_DIR}/docker-compose-test.yml build
docker network ls
docker ps -a
# docker-compose -f ${DAPPNODE_DIR}/docker-compose-test.yml run test