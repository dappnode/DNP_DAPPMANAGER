#!/bin/bash

# https://linuxize.com/post/how-to-check-linux-version/

# Exit on error
set -e

function get_system_info(){
  # info about /etc/os-release: https://www.freedesktop.org/software/systemd/man/os-release.html#:~:text=The%20%2Fetc%2Fos%2Drelease,like%20shell%2Dcompatible%20variable%20assignments.
  if [ -f /etc/os-release ]; then
    source /etc/os-release
    ID=$ID
    VERSION_CODENAME=$VERSION_CODENAME
    VERSION_ID=$VERSION_ID
  fi

  # To ensure values are set, use command lsb_release
  if type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    if [ -z "$ID" ]; then
      ID=$(lsb_release -si)
    fi
    if [ -z "$VERSION_ID" ]; then
      VERSION_ID=$(lsb_release -sr)
    fi
    if [ -z "$VERSION_CODENAME" ]; then
      VERSION_CODENAME=$(lsb_release -sc)
    fi
  fi
}

function get_architecture() {
  if type dpkg >/dev/null 2>&1; then
    ARCHITECTURE=$(dpkg --print-architecture)
  elif type uname >/dev/null 2>&1; then
    ARCHITECTURE=$(uname -m)
  fi
}

function get_linux_kernel() {
  if type uname >/dev/null 2>&1; then
    KERNEL=$(uname -r)
  fi
}

function get_docker_engine_version() {
  # Check if docker exists
  if type docker >/dev/null 2>&1; then
    DOCKER_SERVER_VERSION=$(docker version --format '{{.Server.Version}}')
    DOCKER_CLI_VERSION=$(docker version --format '{{.Client.Version}}')
  fi
}

function get_docker_compose_version() {
  # Initialize DOCKER_COMPOSE_VERSION to an empty value
  DOCKER_COMPOSE_VERSION=""

  # Check if new 'docker compose' command exists
  if type docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker compose version --short)
  # Check if older 'docker-compose' command exists if the new one doesn't
  elif type docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker-compose version --short)
  fi
}


#######################
###### MAIN LOOP ######
#######################

get_system_info
get_architecture
get_linux_kernel
get_docker_engine_version
get_docker_compose_version

echo -n "{\"dockerComposeVersion\": \"${DOCKER_COMPOSE_VERSION}\", \"dockerServerVersion\": \"${DOCKER_SERVER_VERSION}\", \"dockerCliVersion\": \"${DOCKER_CLI_VERSION}\", \"os\": \"${ID}\", \"versionCodename\": \"${VERSION_CODENAME}\", \"versionId\": \"${VERSION_ID}\", \"architecture\": \"${ARCHITECTURE}\", \"kernel\": \"${KERNEL}\"}"
exit 0