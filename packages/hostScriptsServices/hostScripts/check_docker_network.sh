#!/bin/bash

network_name="dncore_network"
max_retries=5
retry_delay=60

# Function to check and create network with retry logic
check_and_create_network() {
    for ((i=0; i<max_retries; i++)); do
        if docker network inspect "$network_name" &> /dev/null; then
            echo "Docker network '$network_name' exists."
            return 0
        else
            echo "ATTENTION! Docker network '$network_name' does not exist. Creating it..."
            # Check the core docker image tag to get the version and determine the subnet to be used for creating the docker core network
            core_version="$(docker image ls --filter reference="core.dnp.dappnode.eth" --format '{{.Tag}}' | sort -V | tail -n 1)"
            echo "core version retrieved $core_version"

            # Compare with 0.2.30 using sort
            if printf '0.2.30\n%s\n' "$core_version" | sort -V | head -n 1 | grep -q '0.2.30'; then
                subnet="10.20.0.0/24"
                # core_version is greater than or equal to 0.2.30
                echo "Core version is greater than or equal to 0.2.30, using subnet $subnet"
            else
                subnet="172.33.0.0/16"
                # core_version is less than 0.2.30
                echo "Core version is less than 0.2.30, using subnet $subnet"
            fi

            # Attempt to create docker network with subnet
            if ! docker network create --driver bridge --subnet "$subnet" "$network_name"; then
                echo "Failed to create Docker network with subnet. Attempting to create without subnet..."
                if ! docker network create --driver bridge "$network_name"; then
                    echo "Failed to create Docker network without subnet. Exiting."
                    exit 1
                fi
            fi

            echo "Docker network '$network_name' with subnet '$subnet' created successfully."

            # start dappnode core and dappnode non-core containers
            DNCORE_YMLS=$(find "/usr/src/dappnode/DNCORE" -name "docker-compose-*.yml" -printf "-f %p ")
            docker-compose "$DNCORE_YMLS" up -d && docker start "$(docker container ls -a -q -f name=DAppNode*)"

            if [ "$i" -lt $((max_retries - 1)) ]; then
                echo "Retrying in $retry_delay seconds..."
                sleep $retry_delay
            fi
        fi
    done
    return 1
}

# Execute network check/create with retry logic
check_and_create_network || echo "docker network $network_name has been recreated after $max_retries attempts."