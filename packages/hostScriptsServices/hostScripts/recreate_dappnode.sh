#!/bin/bash

# Host script service executed with a timer to ensure dappmanager container is running, otherwise recreate dappnode to latest version
# The edge case where the dappmanager container does not exist is not covered

# Name of the dappmanager Docker container
DAPPMANAGER_CONTAINER_NAME="DAppNodeCore-dappmanager.dnp.dappnode.eth"

# Check the status of the container
# Possible docker container status: created, exited, dead, created, restarting, paused and running
STATUS=$(docker inspect --format='{{.State.Status}}' "$DAPPMANAGER_CONTAINER_NAME" 2>/dev/null)

# For safety check for docker container status not expected instead of checking for running
if [ "$STATUS" == "created" ] || [ "$STATUS" == "exited" ] || [ "$STATUS" == "dead" ] || [ "$STATUS" == "created" ] || [ "$STATUS" == "restarting" ] || [ "$STATUS" == "paused" ]; then
    echo "Container $DAPPMANAGER_CONTAINER_NAME is not running. Status: $STATUS. Double checking before recreating dappnode to latest version."
    counter=0
    # check 5 times with a 5 seconds delay the status is still the same. If 3 or more times the status is the same, then recreate dappnode
    # This way we ensure dappmanager is not updating or in an intermedium state
    for i in {1..5}; do
        # check the status of the container
        STATUS=$(docker inspect --format='{{.State.Status}}' "$DAPPMANAGER_CONTAINER_NAME" 2>/dev/null)
        # if the status is the same as before, then increase the counter
        if [ "$STATUS" == "created" ] || [ "$STATUS" == "exited" ] || [ "$STATUS" == "dead" ] || [ "$STATUS" == "created" ] || [ "$STATUS" == "restarting" ] || [ "$STATUS" == "paused" ]; then
            ((counter++))
        fi
        sleep 5
    done
    # if the counter is 3 or more, then recreate dappnode
    if [ "$counter" -ge 3 ]; then
        echo "Container $DAPPMANAGER_CONTAINER_NAME is not running after double check. Status: $STATUS. Recreating dappnode to latest version."
        wget -O - https://installer.dappnode.io | sudo UPDATE=true bash 2>&1 | tee dappnode_installation.log
    else
        echo "Container $DAPPMANAGER_CONTAINER_NAME is not running. Status: $STATUS. Not executing command to install DAppNode."
    fi
else
    # do nothing
    return
fi
