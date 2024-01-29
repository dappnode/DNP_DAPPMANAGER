#!/bin/bash

DNCORE_DIR="/usr/src/dappnode/DNCORE"
DAPPMANAGER_DNCORE_FILE="$DNCORE_DIR/docker-compose-dappmanager.yml"
LOG_DIR="/usr/src/dappnode/logs"
RECREATE_DAPPNODE_LOG_FILE="$DNCORE_DIR/recreate_dappnode.log"

# Name of the dappmanager Docker container
DAPPMANAGER_CONTAINER_NAME="DAppNodeCore-dappmanager.dnp.dappnode.eth"

# Create logs dir if not exist
mkdir -p "$LOG_DIR"

# dappmanager docker compose file does not exist, then install DAppNode
if [ ! -f "$DAPPMANAGER_DNCORE_FILE" ]; then
    echo "File $DAPPMANAGER_DNCORE_FILE does not exist. Installing DAppNode." | tee "$RECREATE_DAPPNODE_LOG_FILE"
    wget -O - https://installer.dappnode.io | sudo UPDATE=true bash 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE" 
    return
fi 

# dappmanager docker container does not exist, then run docker compose up to dappmanager file
if [ ! "$(docker ps -q -f -a name="$DAPPMANAGER_CONTAINER_NAME")" ]; then
    echo "Container $DAPPMANAGER_CONTAINER_NAME does not exist. Running docker compose up to dappmanager file." | tee "$RECREATE_DAPPNODE_LOG_FILE"
    docker-compose -f "$DAPPMANAGER_DNCORE_FILE" up -d 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE"
    # if the previous command fails, then recreate dappnode
    if [ $? -ne 0 ]; then
        echo "Error while docker compose up $DAPPMANAGER_DNCORE_FILE. Recreating dappnode to latest version." | tee "$RECREATE_DAPPNODE_LOG_FILE"
        wget -O - https://installer.dappnode.io | sudo UPDATE=true bash 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE"
    fi
    return
fi

# Check the status of the container
# Possible docker container status: created, exited, dead, created, restarting, paused and running
STATUS=$(docker inspect --format='{{.State.Status}}' "$DAPPMANAGER_CONTAINER_NAME" 2>/dev/null)

# For safety check for docker container status not expected instead of checking for running
if [ "$STATUS" == "restarting" ]; then
    echo "Container $DAPPMANAGER_CONTAINER_NAME is not running. Status: $STATUS. Double checking before recreating dappnode to latest version." | tee "$RECREATE_DAPPNODE_LOG_FILE"
    counter=0
    # check 5 times with a 5 seconds delay the status is still the same. If 3 or more times the status is the same, then recreate dappnode
    # This way we ensure dappmanager is not updating or in an intermedium state
    for i in {1..5}; do
        # check the status of the container
        STATUS=$(docker inspect --format='{{.State.Status}}' "$DAPPMANAGER_CONTAINER_NAME" 2>/dev/null)
        # if the status is the same as before, then increase the counter
        if [ "$STATUS" == "restarting" ]; then
            ((counter++))
        fi
        sleep 5
    done
    # if the counter is 3 or more, then recreate dappnode
    if [ "$counter" -ge 3 ]; then
        echo "Container $DAPPMANAGER_CONTAINER_NAME is restarting after 25s. Status: $STATUS. Recreating dappnode to latest version." | tee "$RECREATE_DAPPNODE_LOG_FILE"
        wget -O - https://installer.dappnode.io | sudo UPDATE=true bash 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE"
    else
        echo "Container $DAPPMANAGER_CONTAINER_NAME recovered from restarting state. Doing nothing." | tee "$RECREATE_DAPPNODE_LOG_FILE"
    fi
elif [ "$STATUS" == "created" ] || [ "$STATUS" == "exited" ] || [ "$STATUS" == "dead" ] || [ "$STATUS" == "paused" ]; then
    echo "Container $DAPPMANAGER_CONTAINER_NAME is not running. Status: $STATUS. Running docker restart to dappmanager." | tee "$RECREATE_DAPPNODE_LOG_FILE"
    docker restart "$DAPPMANAGER_CONTAINER_NAME" 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE"
    # if the previous command fails, then recreate dappnode
    if [ $? -ne 0 ]; then
        echo "Error while docker restart to $DAPPMANAGER_CONTAINER_NAME. Recreating dappnode to latest version." | tee "$RECREATE_DAPPNODE_LOG_FILE"
        wget -O - https://installer.dappnode.io | sudo UPDATE=true bash 2>&1 | tee "$RECREATE_DAPPNODE_LOG_FILE"
    fi
else
    # do nothing
    return
fi
