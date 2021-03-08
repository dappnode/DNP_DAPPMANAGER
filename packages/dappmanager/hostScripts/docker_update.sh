#!/bin/bash

###################
##### OPTIONS #####
###################

# engine
#    -v | --version : returns string with docker-server version
#    -i | --install : installs docker engine using "package method". If error returns string error
# compose
#    -v | --version : returns string with docker compose version
#    -i | --install : installs docker compose. If error returns string error
# system: returns system info: OS, version and docker versions (compose and engine)

#####################
### CONFIGURATION ###
#####################

# non-case sensitive (only available in bash)
shopt -s nocasematch

# Exit on error
set -e

####################
### ERRORS CODES ###
####################

# 2 => no match requirements
# 3 => unable to retrieve architecture
# 4 => unable to retrieve os info
# 5 => docker does not exist
# 6 => docker compose does not exist
# 7 => docker engine is stable
# 8 => docker compose is stable
# 9 => architecture not supported
# 10 => Debian version not supported by docker and/or dappnode
# 12 => Only 1 argument accepted
# 13 => Arg must be docker-engine or docker-compose
# 14 => flag must be -i | --install OR -v | --version
# 15 => Illegal to downgrade docker engine (current docker version > than stable docker version)
# 16 => Illegal to downgrade docker compose (current compose version > than stable compose version)

###################
#####VARIABLES#####
###################

# Docker stable versions
STABLE_DOCKER_ENGINE_VERSION="20.10.2" # Same for PKG and CLI
STABLE_DOCKER_CONTAINERD_VERSION="1.4.3-1"

# Docker compose stable versions
STABLE_DOCKER_COMPOSE_VERSION="1.25.5"

# Download
WGET="wget -q -O"

#####################
##### FUNCTIONS #####
#####################

function check_requirements() {
  # check is debian
  if [[ "$ID" != "debian" ]]; then
    echo "OS must be debian"
    exit 2
  fi

  if [ "$INSTALL_OPTION" == "engine" ]; then
    # get DOCKER_SERVER_VERSION and DOCKER_CLI_VERSION
    get_docker_engine_version

    # check if docker version is equal or lower than the stable version
    if [[ $DOCKER_SERVER_VERSION == "$STABLE_DOCKER_ENGINE_VERSION" ]]; then
      echo "docker engine version is already stable"
      exit 7
    elif $(dpkg --compare-versions ${STABLE_DOCKER_ENGINE_VERSION} "lt" ${DOCKER_SERVER_VERSION}); then 
      echo "Illegal to downgrade docker engine"
      exit 15
    fi
  else
    # get DOCKER_SERVER_VERSION and DOCKER_CLI_VERSION
    get_docker_compose_version

    # check if docker compose version is equal or lower than the stable
    if [[ "$DOCKER_COMPOSE_VERSION" == "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
      echo "docker compose version is stable"
      exit 8
    elif $(dpkg --compare-versions ${STABLE_DOCKER_COMPOSE_VERSION} "lt" ${DOCKER_COMPOSE_VERSION}); then 
      echo "Illegal to downgrade docker compose"
      exit 16
    fi
  fi

  # check if architecture is supported by docker
  if [ "$ARCHITECTURE" !=  "amd64" ] && [ "$ARCHITECTURE" !=  "arm64" ] && [ "$ARCHITECTURE" !=  "armhf" ]; then
    echo "Architecture not supported by docker. Architectures allowed: amd64, arm64 and armhf"
    exit 9
  fi

  # check if debian version is supported by docker
  if [ "$VERSION_CODENAME" != "buster" ] && [ "$VERSION_CODENAME" != "stretch" ] && [ "$VERSION_CODENAME" != "bullseye" ]; then
    echo "Debian version not supported by docker and/or dappnode. Versions supported: buster, stretch and bullseye"
    exit 10
  fi
}

function get_system_info(){
  # info about /etc/os-release: https://www.freedesktop.org/software/systemd/man/os-release.html#:~:text=The%20%2Fetc%2Fos%2Drelease,like%20shell%2Dcompatible%20variable%20assignments.
  if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    . /etc/os-release
    # ID=Debian|ubuntu...
    ID=$ID
    # VERSION_ID=10,9...
    VERSION_ID=$VERSION_ID
    # IMPORTANT: VERSION_CODENAME might be empty in bullseye. Will be set with lsb_release command
    # VERSION_CODENAME=Bullyese|Stretch
    VERSION_CODENAME=$VERSION_CODENAME
    # PRETTY_NAME is mandatory and use to contain the OS version (could be used with grep)
  fi

  # To ensure values are set, use of command lsb_release
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

  # Check if all values are set
  if [ -z "$ID" ] || [ -z "$VERSION_ID" ] || [ -z "$VERSION_CODENAME" ]; then
    echo "Error retrieving system info: operating system and version"
    exit 4
  fi
}

function get_architecture() {
  if type dpkg >/dev/null 2>&1; then
    ARCHITECTURE=$(dpkg --print-architecture)
  elif type uname >/dev/null 2>&1; then
    ARCHITECTURE=$(uname -m)
    # x86_64 is equal to amnd64, correct the value
    if [[ "$ARCHITECTURE" == "x86_64" ]]; then
      ARCHITECTURE="amd64"
    fi
  else
    echo "Error retrieving architecture"
    exit 3
  fi
}

function install_docker_engine(){
  # Note: The client and container runtime are now in separate packages from the daemon in Docker Engine 18.09.
  # Users should install and update all three packages at the same time to get the latest patch releases

  # TEMPORARY: Bullseye consider as Buster until it gets supported by docker
  if [ "$VERSION_CODENAME" == "bullseye" ]; then
    VERSION_CODENAME="buster"
  fi

  # Change versions for stretch
  if [ "$VERSION_CODENAME" != "buster" ]; then
    STABLE_DOCKER_ENGINE_VERSION="19.03.8"
    STABLE_DOCKER_CONTAINERD_VERSION="1.2.6-3"
  fi
  
  # Metadata
  DOCKER_PKG="docker-ce_${STABLE_DOCKER_ENGINE_VERSION}~3-0~debian-${VERSION_CODENAME,,}_${ARCHITECTURE}.deb"
  DOCKER_CLI="docker-ce-cli_${STABLE_DOCKER_ENGINE_VERSION}~3-0~debian-${VERSION_CODENAME,,}_${ARCHITECTURE}.deb"
  DOCKER_CONTAINERD="containerd.io_${STABLE_DOCKER_CONTAINERD_VERSION}_${ARCHITECTURE}.deb"

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
  mkdir -p "$DOCKER_ENGINE_PATH/bin/docker"

  # STEP 1: Download files
  $WGET $DOCKER_PKG_PATH $DOCKER_PKG_URL
  $WGET $DOCKER_CLI_PATH $DOCKER_CLI_URL
  $WGET $DOCKER_CONTAINERD_PATH $DOCKER_CONTAINERD_URL

  # STEP 2: Install packages
  dpkg -i $DOCKER_CONTAINERD_PATH
  dpkg -i $DOCKER_CLI_PATH
  dpkg -i $DOCKER_PKG_PATH

  # Post installation
  USER=$(grep 1000 "/etc/passwd" | cut -f 1 -d:)
  [ -z "$USER" ] || usermod -aG docker "$USER"
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
}

function post_install_check() {
  # Docker-engine post installation check
  if [ $INSTALL_OPTION == "engine" ]; then
    DAPPMANAGER_CONTAINER="DAppNodeCore-dappmanager.dnp.dappnode.eth"

    # If is container restarting wait 10 s
    RESTARTING=$(docker inspect --format="{{.State.Restarting}}" $DAPPMANAGER_CONTAINER)
    if [ $RESTARTING = true ]; then
      sleep 10
    fi

    # Check if container is not running reboot
    RUNNING=$(docker inspect --format="{{.State.Running}}" $DAPPMANAGER_CONTAINER 2> /dev/null)
    if [ $RUNNING = false ]; then
      echo "Dappmanager container is not running. Rebooting..."
      reboot
    fi

    # Check version post installation equals stable engine version
    DOCKER_SERVER_POST_INSTALLATION=$(docker version --format '{{.Server.Version}}')
    DOCKER_CLI_POST_INSTALLATION=$(docker version --format '{{.Client.Version}}')
    if [ "$DOCKER_SERVER_POST_INSTALLATION" != "$STABLE_DOCKER_ENGINE_VERSION" ] || [ "$STABLE_DOCKER_ENGINE_VERSION" != "$DOCKER_CLI_POST_INSTALLATION" ]; then
      echo "Update unsucessfull, versions are not equal. Rebooting..."
      reboot 
    fi

  # Docker-compose post installation check
  elif [ $INSTALL_OPTION == "compose" ]; then
    # Check version post installation equals stable compose version
    DOCKER_COMPOSE_POST_INSTALLATION=$(docker-compose version --short)
    if [[ "$DOCKER_ENGINE_POST_INSTALLATION" != "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
      echo "Update unsucessfull, versions are not equal. Rebooting..."
      reboot
    fi
  fi
}

function get_docker_engine_version() {
  # Check if docker exists
  if type docker >/dev/null 2>&1; then
    DOCKER_SERVER_VERSION=$(docker version --format '{{.Server.Version}}')
    DOCKER_CLI_VERSION=$(docker version --format '{{.Client.Version}}')
  else 
    echo "docker does not exist or not recognized"
    exit 5
  fi
}

function get_docker_compose_version() {
  # Check if docker compose exists
  if type docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker-compose version --short)
  else 
    echo "docker compose does not exist or not recognized"
    exit 6
  fi
}

#######################
###### MAIN LOOP ######
#######################
# Ensure argument is defined
if [ "$1" != "engine" ] && [ "$1" != "compose" ] && [ "$1" != "system" ]; then
  echo "Arg must be engine or compose"
  exit 13
fi

if [ "$1" == "engine" ] || [ "$1" == "compose" ]; then
  # Ensure 2 arguments
  if [ "$#" -ne 2 ]; then
    echo "Illegal number of parameters"
    exit 12
  fi
  INSTALL_OPTION=$1

  case $2 in
    -i | --install )
      # Pre install
      get_system_info
      get_architecture
      check_requirements
      if [ $INSTALL_OPTION == "engine" ]; then
        install_docker_engine
        post_install_check
        echo "Updated docker engine to ${STABLE_DOCKER_ENGINE_VERSION} successfully"
        exit 0
      else
        install_docker_compose
        post_install_check
        echo "Updated docker engine to ${STABLE_DOCKER_COMPOSE_VERSION} successfully"
        exit 0
      fi
    ;;
    -v | --version )
      if [ $INSTALL_OPTION == "engine" ]; then
        get_docker_engine_version
        echo $DOCKER_SERVER_VERSION
        exit 0
      else
        get_docker_compose_version
        echo $DOCKER_COMPOSE_VERSION
        exit 0
      fi
    ;;
    * )
      echo "flag must be -i or -v" 
      exit 14
  esac
elif [ "$1" == "system" ]; then
# Ensure 2 arguments
  if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
    exit 12
  fi
  get_system_info
  get_docker_compose_version
  get_docker_engine_version
  get_architecture
  echo -n "{\"dockerComposeVersion\": \"${DOCKER_COMPOSE_VERSION}\", \"dockerServerVersion\": \"${DOCKER_SERVER_VERSION}\", \"dockerCliVersion\": \"${DOCKER_CLI_VERSION}\", \"os\": \"${ID}\", \"versionCodename\": \"${VERSION_CODENAME}\", \"architecture\": \"${ARCHITECTURE}\"}"
  exit 0
fi