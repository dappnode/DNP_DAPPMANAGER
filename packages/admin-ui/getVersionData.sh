#!/bin/bash

# The purpose of this script is to export version variables
# to be used during the yarn build. The Dockerfile should run
#   RUN source ./getVersionData.sh && yarn run build

export REACT_APP_VERSION=$(cat dappnode_package.json | jq '.version')
export REACT_APP_BRANCH=$(git rev-parse --abbrev-ref HEAD)
export REACT_APP_COMMIT=$(git rev-parse --verify HEAD)

echo "REACT_APP_VERSION=${REACT_APP_VERSION}" >> .env.production
echo "REACT_APP_BRANCH=${REACT_APP_BRANCH}" >> .env.production
echo "REACT_APP_COMMIT=${REACT_APP_COMMIT}" >> .env.production

cat .env.production
