#!/bin/bash

# Beware in the test docker-compose that travis 
# will do a docker-compose up in a the directory DNPIPFS
# Therefore the name of the network has to be dnpbind_network

# Install bind
##############

DAPPNODE_DIR="test_build"
mkdir -p $DAPPNODE_DIR

export BIND_VERSION="0.1.5"
export IPFS_VERSION="0.1.3"
export WAMP_VERSION="0.1.0"
BIND_URL="https://github.com/dappnode/DNP_BIND/releases/download/v${BIND_VERSION}/bind.dnp.dappnode.eth_${BIND_VERSION}.tar.xz"
IPFS_URL="https://github.com/dappnode/DNP_IPFS/releases/download/v${IPFS_VERSION}/ipfs.dnp.dappnode.eth_${IPFS_VERSION}.tar.xz"
WAMP_URL="https://github.com/dappnode/DNP_WAMP/releases/download/v${WAMP_VERSION}/wamp.dnp.dappnode.eth_${WAMP_VERSION}.tar.xz"
BIND_YML="https://github.com/dappnode/DNP_BIND/releases/download/v${BIND_VERSION}/docker-compose-bind.yml"
IPFS_YML="https://github.com/dappnode/DNP_IPFS/releases/download/v${IPFS_VERSION}/docker-compose-ipfs.yml"
WAMP_YML="https://github.com/dappnode/DNP_WAMP/releases/download/v${WAMP_VERSION}/docker-compose-wamp.yml"
BIND_YML_FILE="${DAPPNODE_DIR}/docker-compose-bind.yml"
IPFS_YML_FILE="${DAPPNODE_DIR}/docker-compose-ipfs.yml"
WAMP_YML_FILE="${DAPPNODE_DIR}/docker-compose-wamp.yml"
BIND_FILE="${DAPPNODE_DIR}/bind.dnp.dappnode.eth_${BIND_VERSION}.tar.xz"
IPFS_FILE="${DAPPNODE_DIR}/ipfs.dnp.dappnode.eth_${IPFS_VERSION}.tar.xz"
WAMP_FILE="${DAPPNODE_DIR}/wamp.dnp.dappnode.eth_${IPFS_VERSION}.tar.xz"

wget -O $BIND_FILE $BIND_URL
wget -O $IPFS_FILE $IPFS_URL
wget -O $WAMP_FILE $WAMP_URL
wget -O $IPFS_YML_FILE $IPFS_YML
wget -O $BIND_YML_FILE $BIND_YML
wget -O $WAMP_YML_FILE $WAMP_YML

docker load -i $BIND_FILE
docker load -i $IPFS_FILE
docker load -i $WAMP_FILE

# Delete build line frome yml
sed -i '/build: \.\/build/d' $BIND_YML_FILE
sed -i '/build: \.\/build/d' $IPFS_YML_FILE
sed -i '/build: \.\/build/d' $WAMP_YML_FILE

# Start bind and ipfs
docker-compose -f $BIND_YML_FILE up -d
docker-compose -f $IPFS_YML_FILE up -d
docker-compose -f $WAMP_YML_FILE up -d

# Prepare test
##############

cp -r build $DAPPNODE_DIR
cp -r test/* $DAPPNODE_DIR
mkdir -p $DAPPNODE_DIR/.git && cp -r .git/* $DAPPNODE_DIR/.git
cp dappnode_package.json $DAPPNODE_DIR

docker-compose -f ${DAPPNODE_DIR}/docker-compose-dappmanager.yml build