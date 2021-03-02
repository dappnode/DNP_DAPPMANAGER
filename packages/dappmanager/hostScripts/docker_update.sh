#!/bin/bash
#
# Script to update docker engine OR docker compose
# ARGUMENTS: exactly 1 (between: "engine" and "compose")

# Exit on error
set -e

### ERRORS CODES:
# 2 => no match requirements
# 3 => unable to retrieve architecture
# 4 => unable to retrieve os info
# 5 => docker does not exist
# 6 => docker compose does not exist
# 7 => docker engine is stable
# 8 => docker compose is stable
# 9 => architecture not supported
# 10 => Debian version not supported by docker and/or dappnode
# 11 => update docker engine unsuccessful
# 12 => Only 1 argument accepted
# 13 => Arg must be docker-engine or docker-compose
# 14 => update docker compose unsuccessful

# (amd64 | x86_64) | (arm64 | )
ARCHITECTURE=""
# ubuntu, debian...
ID=""
# 10, 9, 18.04 ...
VERSION_ID=""
# buster, stretch, bionic ...
VERSION_CODENAME=""
PRETTY_NAME=""
# 19.03.8
DOCKER_ENGINE_VERSION=""
STABLE_DOCKER_ENGINE_VERSION="19.03.8"
# 1.25.5
DOCKER_COMPOSE_VERSION=""
STABLE_DOCKER_COMPOSE_VERSION="1.25.5"

# Download
WGET="wget -q -O"

# non-case sensitive (only available in bash)
shopt -s nocasematch

function check_requirements() {
  # check is debian
  if [[ "$ID" != "debian" ]]; then
    echo "OS must be debian"
    exit 2
  fi

  if [[ "$1" == "engine" ]]; then
    # check if docker exists
    if type docker >/dev/null 2>&1; then
      DOCKER_ENGINE_VERSION=$(docker version --format '{{.Server.Version}}')
      # check if docker version is the one to be installed
      if [[ $DOCKER_ENGINE_VERSION == "$STABLE_DOCKER_ENGINE_VERSION" ]]; then
        echo "docker engine version is stable"
        exit 7
      fi
    else
      echo "docker does not exist"
      exit 5
    fi
  else
    # check if docker-compose exists
    if type docker-compose >/dev/null 2>&1; then
      # check if docker compose version is the one to be installed
      DOCKER_COMPOSE_VERSION=$(docker-compose version --short)
      # check if docker compose version is the one to be installed
      if [[ "$DOCKER_COMPOSE_VERSION" == "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
        echo "docker compose version is stable"
        exit 8
      fi
    else
      echo "docker compose does not exist"
      exit 6
    fi
  fi

  # check if architecture is supported by docker
  if [ "$ARCHITECTURE" !=  "amd64" ] && [ "$ARCHITECTURE" !=  "arm64" ] && [ "$ARCHITECTURE" !=  "armhf" ]; then
    echo "architecture not supported by docker"
    exit 9
  fi

  # check if debian version is supported by docker
  if [ "$VERSION_CODENAME" != "buster" ] && [ "$VERSION_CODENAME" != "stretch"] && [ "$VERSION_CODENAME" != "bullseye" ]; then
    echo "Debian version not supported by docker and/or dappnode"
    exit 10
  fi
}

function get_system_info(){
  # info about /etc/os-release: https://www.freedesktop.org/software/systemd/man/os-release.html#:~:text=The%20%2Fetc%2Fos%2Drelease,like%20shell%2Dcompatible%20variable%20assignments.
  if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    ID=$ID
    VERSION_ID=$VERSION_ID
    # IMPORTANT: VERSION_CODENAME might be empty in bullyese. Will be set with lsb_release command
    VERSION_CODENAME=$VERSION_CODENAME
    # PRETTY_NAME is mandatory and use to contain the OS version (could be used with grep)
  fi

  if type lsb_release >/dev/null 2>&1 && [ -z "$ID" ] || [ -z "$VERSION_ID" ] || [ -z "$VERSION_CODENAME" ]; then
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

  if [ -z "$ID" ] || [ -z "$VERSION_ID" ] || [ -z "$VERSION_CODENAME" ]; then
    echo "Error retrieving system info"
    exit 4
  fi
}

function get_architecture() {
  if type uname >/dev/null 2>&1; then
    # x86_64
    ARCHITECTURE=$(uname -m)
    if [[ "$ARCHITECTURE" == "x86_64" ]]; then
      ARCHITECTURE="amd64"
    fi
  elif type dpkg >/dev/null 2>&1; then
    # amd64
    ARCHITECTURE=$(dpkg --print-architecture)
  else
    echo "Error retrieving architecture"
    exit 3
  fi
}

function install_docker_engine(){
  # Note: The client and container runtime are now in separate packages from the daemon in Docker Engine 18.09.
  # Users should install and update all three packages at the same time to get the latest patch releases
  
  # Metadata
  # https://download.docker.com/linux/debian/dists/stretch/pool/stable/amd64
  DOCKER_PKG="docker-ce_19.03.8~3-0~debian-stretch_amd64.deb"
  DOCKER_CLI="docker-ce-cli_19.03.8~3-0~debian-stretch_amd64.deb"
  DOCKER_CONTAINERD="containerd.io_1.2.6-3_amd64.deb"

  # URLs
  DOCKER_URL="https://download.docker.com/linux/debian/dists/${VERSION_CODENAME,,}/pool/stable/${ARCHITECTURE}"
  DOCKER_PKG_URL="${DOCKER_URL}/${DOCKER_PKG}"
  DOCKER_CLI_URL="${DOCKER_URL}/${DOCKER_CLI}"
  DOCKER_CONTAINERD_URL="${DOCKER_URL}/${DOCKER_CONTAINERD}"

  # Paths
  DOCKER_ENGINE_PATH="/usr/src/dappnode"
  DOCKER_PKG_PATH="${DOCKER_ENGINE_PATH}/bin/docker/${DOCKER_PKG}"
  DOCKER_CLI_PATH="${DOCKER_ENGINE_PATH}/bin/docker/${DOCKER_CLI}"
  DOCKER_CONTAINERD_PATH="${DOCKER_ENGINE_PATH}/bin/docker/${DOCKER_CONTAINERD}"
  mkdir -p $DOCKER_ENGINE_PATH
  mkdir -p $DOCKER_PKG_PATH

  # STEP 1: Download files
  $WGET $DOCKER_PKG_PATH $DOCKER_URL
  $WGET $DOCKER_CLI_PATH $DOCKER_CLI_URL
  $WGET $CONTAINERD_PATH $DOCKER_CONTAINERD_URL

  # STEP 2: Install packages
  dpkg -i $DOCKER_PKG_PATH
  dpkg -i $DOCKER_CLI_PATH
  dpkg -i $DOCKER_CONTAINERD_PATH

  # Post installation
  if [[ -z "$USER" ]]; then
    USER=$(grep 1000 "/etc/passwd" | cut -f 1 -d:)
  fi
  groupadd docker
  usermod -aG docker $USER

  # Verify installation
  DOCKER_ENGINE_POST_INSTALLATION=$(docker version --format '{{.Server.Version}}')
  if [[ "$DOCKER_ENGINE_POST_INSTALLATION" == "$STABLE_DOCKER_ENGINE_VERSION" ]]; then
    echo "Update succesfull"
    exit 0
  else
    echo "Update unsucessfull"
    exit 14
  fi
}

function install_docker_compose() {
  # URLs
  DCMP_URL="https://github.com/docker/compose/releases/download/${STABLE_DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"

  # Paths
  DCMP_PATH="/usr/local/bin/docker-compose"
  mkdir -p $DCMP_PATH

  # STEP 1: Download file
  $WGET $DCMP_PATH $DCMP_URL

  # Post installation
  chmod +x $DCMP_PATH

  # Verify installation
  DOCKER_COMPOSE_POST_INSTALLATION=$(docker-compose version --short)
  if [[ "$DOCKER_ENGINE_POST_INSTALLATION" == "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
    echo "Update succesfull"
    exit 0
  else
    echo "Update unsucessfull"
    exit 11
  fi
}

##### MAIN LOOP #####
# Ensure 1 argument
if [ "$#" -ne 1 ]; then
  echo "Illegal number of parameters"
  exit 12
fi
# Ensure argument is defined
if [ "$1" != "engine" ] && [ "$1" != "compose" ]; then
  echo "Arg must be docker-engine or docker-compose"
  exit 13
fi

get_system_info
get_architecture
check_requirements

if [ "$1" == "engine"]; then
  install_docker_engine
else
  install_docker_compose
fi
##### MAIN LOOP #####