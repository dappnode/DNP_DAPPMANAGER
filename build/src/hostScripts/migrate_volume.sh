#!/bin/bash
#
# Script to migrate a docker volume.
# It's original purpose is to migrate ETHCHAIN volumes to multi-client model.
#

# Exit on error
set -e

FROM_VOLUME_NAME=$1
TO_VOLUME_NAME=$2

DOCKER_ROOT_DIR=$(docker info -f '{{ .DockerRootDir }}')

if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters. Please provide origin and destination volume."
    exit 1
fi

mv "${DOCKER_ROOT_DIR}/volumes/${FROM_VOLUME_NAME}" "${DOCKER_ROOT_DIR}/volumes/${TO_VOLUME_NAME}"
