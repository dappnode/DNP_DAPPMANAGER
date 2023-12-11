#!/bin/bash

# Copy from the /tmp-app to /app to overwrite the node_modules and builds
# this is needed because the docker volume is mounted after the docker build
# and the node_modules and builds are not available in the docker build
cp -r /tmp-app/* /app/

# link important directories
ln -s /app/packages/admin-ui/build/ /app/packages/dappmanager/dist
ln -s /usr/src/app/dnp_repo/ /app/packages/dappmanager
ln -s /usr/src/app/DNCORE/ /app/packages/dappmanager

# execute the scripts in background and wait
yarn dev &
wait