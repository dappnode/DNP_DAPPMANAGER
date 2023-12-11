#!/bin/bash

# link important directories
ln -s /app/packages/admin-ui/build/ /app/packages/dappmanager/dist
ln -s /usr/src/app/dnp_repo/ /app/packages/dappmanager
ln -s /usr/src/app/DNCORE/ /app/packages/dappmanager

# execute the scripts in background
for dir in /app/packages/*; do
    if [ -d "$dir" ]; then
        cd $dir
        yarn dev &
    fi
done

# wait for all processes to finish
wait