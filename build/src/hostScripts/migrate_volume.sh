#!/bin/bash
#
# Script to migrate a docker volume.
# It's original purpose is to migrate ETHCHAIN volumes to multi-client model.

# Exit on error
set -e

FROM_VOLUME_NAME=$1
TO_VOLUME_NAME=$2

DOCKER_ROOT_DIR=$(docker info -f '{{ .DockerRootDir }}')

if [[ -z "${FROM_VOLUME_NAME}" ]]; then
  echo "arg 1 FROM_VOLUME_NAME is empty"
  exit 1
fi

if [[ -z "${TO_VOLUME_NAME}" ]]; then
  echo "arg 2 TO_VOLUME_NAME is empty"
  exit 1
fi

if [[ -z "${DOCKER_ROOT_DIR}" ]]; then
  echo "DOCKER_ROOT_DIR is empty"
  exit 1
fi

FROM_PATH=${DOCKER_ROOT_DIR}/volumes/${FROM_VOLUME_NAME}
TO_PATH=${DOCKER_ROOT_DIR}/volumes/${TO_VOLUME_NAME}

if [[ -d "${TO_PATH}" ]]; then
  echo "Error: ${TO_PATH} already exists."
  exit 1
fi

mv "${FROM_PATH}" "${TO_PATH}"
