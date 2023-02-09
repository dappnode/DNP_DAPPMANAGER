#!/bin/bash

# link important directories
ln -s /app/packages/admin-ui/build/ /app/packages/dappmanager/dist
ln -s /usr/src/app/dnp_repo/ /app/packages/dappmanager
ln -s /usr/src/app/DNCORE/ /app/packages/dappmanager

# Install lerna first
rm -rf node_modules
yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional
yarn

# Build common
cd /app/packages/common/ && rm -rf node_modules && yarn && yarn generate && yarn build

# Build admin-ui
cd /app/packages/admin-ui/ && rm -rf node_modules && yarn && yarn build

# Build dappmanager
cd /app/packages/dappmanager/ && rm -rf node_modules && yarn && yarn build

# execute the scripts in background and wait
cd /app/packages/dappmanager && yarn dev &
cd /app/packages/admin-ui && yarn dev &
wait