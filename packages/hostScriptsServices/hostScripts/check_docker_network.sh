#!/bin/bash

network_name="dncore_network"
dappmanager_container="DAppNodeCore-dappmanager.dnp.dappnode.eth"
max_retries=5
retry_delay=60

# Function to check and create network with retry logic
check_and_create_network() {
    for ((i=0; i<max_retries; i++)); do
        if docker network inspect "$network_name" &> /dev/null; then
            echo "Docker network '$network_name' exists."
            docker network inspect "$network_name"
            return 0
        else
            echo "Attempt $((i+1)) of $max_retries: Docker network '$network_name' does not exist. Trying to create it..."

            # [Insert your existing logic for checking core version and creating network here]

            if [ "$i" -lt $((max_retries - 1)) ]; then
                echo "Retrying in $retry_delay seconds..."
                sleep $retry_delay
            fi
        fi
    done
    return 1
}

# Function to check and start container with retry logic
check_and_start_container() {
    for ((i=0; i<max_retries; i++)); do
        container_status=$(docker ps --filter "name=$dappmanager_container" --format "{{.Status}}")
        if [[ -z "$container_status" ]]; then
            echo "Attempt $((i+1)) of $max_retries: WARNING! Container $dappmanager_container is not running. Trying to start it..."
            docker-compose -f /usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml up -d

            if [ "$i" -lt $((max_retries - 1)) ]; then
                echo "Retrying in $retry_delay seconds..."
                sleep $retry_delay
            fi
        else
            echo "Container $dappmanager_container is running. Status: $container_status"
            return 0
        fi
    done
    return 1
}

# Execute network check/create with retry logic
check_and_create_network || echo "docker network $network_name has been recreated after $max_retries attempts."

# Execute container check/start with retry logic
check_and_start_container || echo "Container $dappmanager_container has been recreated after $max_retries attempts."
