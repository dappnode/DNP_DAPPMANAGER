#!/bin/bash

# non-case sensitive (only available in bash)
shopt -s nocasematch

# Exit on error
set -e

# VARIABLES
LOG_DIR="/usr/src/dappnode/logs"
LOG_FILE="$LOG_DIR/docker_engine_update.log"
DATE=$(date)
# Docker stable versions
STABLE_DOCKER_ENGINE_VERSION="20.10.2" # Same for PKG and CLI
STABLE_DOCKER_CONTAINERD_VERSION="1.4.3-1"

function create_log_file () {
  mkdir -p $LOG_DIR
  echo -e "\e[32mStarting compose update: $DATE\e[0m" >> $LOG_FILE
}

create_log_file

function get_system_info(){
  echo -e "\e[32mRetrieving system info\e[0m" >> $LOG_FILE
  # info about /etc/os-release: https://www.freedesktop.org/software/systemd/man/os-release.html#:~:text=The%20%2Fetc%2Fos%2Drelease,like%20shell%2Dcompatible%20variable%20assignments.
  if [ -f /etc/os-release ]; then
    source /etc/os-release
    # ID=Debian|ubuntu...
    ID=$ID
    # VERSION_ID=10,9...
    VERSION_ID=$VERSION_ID
    # IMPORTANT: VERSION_CODENAME might be empty in bullseye. Will be set with lsb_release command
    # VERSION_CODENAME=Bullyese|Stretch
    VERSION_CODENAME=$VERSION_CODENAME
    # PRETTY_NAME is mandatory and use to contain the OS version (could be used with grep)
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

  # Check if all values are set
  if [ -z "$ID" ] || [ -z "$VERSION_ID" ] || [ -z "$VERSION_CODENAME" ]; then
    echo "Error retrieving system info: operating system and version" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi
}

function get_linux_kernel() {
  echo -e "\e[32mRetrieving Linux kernel\e[0m" >> $LOG_FILE
  if type uname >/dev/null 2>&1; then
    KERNEL=$(uname -r)
  fi
}

function get_architecture() {
  echo -e "\e[32mRetrieving architecture\e[0m" >> $LOG_FILE
  if type dpkg >/dev/null 2>&1; then
    ARCHITECTURE=$(dpkg --print-architecture)
  elif type uname >/dev/null 2>&1; then
    ARCHITECTURE=$(uname -m)
    # x86_64 is equal to amnd64, correct the value
    if [[ "$ARCHITECTURE" == "x86_64" ]]; then
      ARCHITECTURE="amd64"
    fi
  else
    echo "Error retrieving architecture" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi
}

function get_docker_engine_version() {
  echo -e "\e[32mRetrieving docker engine version\e[0m" >> $LOG_FILE
  # Check if docker exists
  if type docker >/dev/null 2>&1; then
    DOCKER_SERVER_VERSION=$(docker version --format '{{.Server.Version}}')
    DOCKER_CLI_VERSION=$(docker version --format '{{.Client.Version}}')
  else 
    echo "docker does not exist or not recognized" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi
}

function get_docker_compose_version() {
  echo -e "\e[32mRetrieving docker compose version\e[0m" >> $LOG_FILE
  # Check if docker compose exists
  if type docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker-compose version --short)
  else 
    echo "docker compose does not exist or not recognized" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi
}

function check_requirements() {
  echo -e "\e[32mChecking requirements\e[0m" >> $LOG_FILE
  # 1. check is same version
  get_docker_engine_version
  if [[ $DOCKER_SERVER_VERSION == "$STABLE_DOCKER_ENGINE_VERSION" ]]; then
    echo "docker engine version is already stable" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi
  
  # 2. Check is downgrade
  if $(dpkg --compare-versions ${STABLE_DOCKER_ENGINE_VERSION} "lt" ${DOCKER_SERVER_VERSION}); then 
    echo "Illegal to downgrade docker engine" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi

  # Check system info:
  get_system_info
  
  # 3.1 check is debian
  if [[ "$ID" != "debian" ]]; then
    echo "OS must be debian" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi

  # 3.2 check is debian version supported by docker
  if [ "$VERSION_CODENAME" != "buster" ] && [ "$VERSION_CODENAME" != "stretch" ] && [ "$VERSION_CODENAME" != "bullseye" ]; then
    echo "Debian version not supported by docker and/or dappnode. Versions supported: buster, stretch and bullseye" 2>&1 | tee -a $LOG_FILE
    exit 1
  fi

  # 4. check is architecture supported by docker
  get_architecture
  if [ "$ARCHITECTURE" !=  "amd64" ] && [ "$ARCHITECTURE" !=  "arm64" ] && [ "$ARCHITECTURE" !=  "armhf" ]; then
    echo "Architecture not supported by docker. Architectures allowed: amd64, arm64 and armhf"  2>&1 | tee -a $LOG_FILE
    exit 1
  fi  
}

function install_docker_engine(){
  echo -e "\e[32mInstalling docker engine\e[0m" >> $LOG_FILE
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

  echo -e "\e[32mDownloading packages\e[0m" >> $LOG_FILE
  # STEP 1: Download files
  wget -q -O $DOCKER_PKG_PATH $DOCKER_PKG_URL
  wget -q -O $DOCKER_CLI_PATH $DOCKER_CLI_URL
  wget -q -O $DOCKER_CONTAINERD_PATH $DOCKER_CONTAINERD_URL

  echo -e "\e[32mInstalling docker packages\e[0m" >> $LOG_FILE
  # STEP 2: Install packages
  dpkg -i $DOCKER_CONTAINERD_PATH
  dpkg -i $DOCKER_CLI_PATH
  dpkg -i $DOCKER_PKG_PATH

  # Post installation
  USER=$(grep 1000 "/etc/passwd" | cut -f 1 -d:)
  [ -z "$USER" ] || usermod -aG docker "$USER"
}

function post_install_check() {
  echo -e "\e[32mPost install check\e[0m" >> $LOG_FILE
  # 1. Check dappmanager is running
  DAPPMANAGER_CONTAINER="DAppNodeCore-dappmanager.dnp.dappnode.eth"

  # If is container restarting wait 10 s
  RESTARTING=$(docker inspect --format="{{.State.Restarting}}" $DAPPMANAGER_CONTAINER)
  if [ $RESTARTING = true ]; then
    sleep 1
  fi

  # Check if container is not running reboot
  RUNNING=$(docker inspect --format="{{.State.Running}}" $DAPPMANAGER_CONTAINER 2> /dev/null)
  if [ $RUNNING = false ]; then
    echo "Dappmanager container is not running. Rebooting..." 2>&1 | tee -a $LOG_FILE
    reboot
  fi

  # 2. Check versions are updated
  DOCKER_SERVER_POST_INSTALLATION=$(docker version --format '{{.Server.Version}}')
  DOCKER_CLI_POST_INSTALLATION=$(docker version --format '{{.Client.Version}}')
  if [ "$DOCKER_SERVER_POST_INSTALLATION" != "$STABLE_DOCKER_ENGINE_VERSION" ] || [ "$STABLE_DOCKER_ENGINE_VERSION" != "$DOCKER_CLI_POST_INSTALLATION" ]; then
    echo "Update unsucessfull, versions are not equal. Rebooting..." 2>&1 | tee -a $LOG_FILE
    reboot 
  fi
}

#######################
###### MAIN LOOP ######
#######################

if [[ $# -eq 1 ]]; then
  flag="$1"
  case "${flag}" in
    --install )
      check_requirements
      install_docker_engine
      post_install_check
      echo "Updated docker engine to ${STABLE_DOCKER_ENGINE_VERSION} successfully" 2>&1 | tee -a $LOG_FILE
      exit 0
      ;;
    --print-host-info )
      get_system_info
      get_docker_compose_version
      get_docker_engine_version
      get_architecture
      get_linux_kernel
      echo -n "{\"dockerComposeVersion\": \"${DOCKER_COMPOSE_VERSION}\", \"dockerServerVersion\": \"${DOCKER_SERVER_VERSION}\", \"dockerCliVersion\": \"${DOCKER_CLI_VERSION}\", \"os\": \"${ID}\", \"versionCodename\": \"${VERSION_CODENAME}\", \"architecture\": \"${ARCHITECTURE}\", \"kernel\": \"${KERNEL}\"}" 2>&1 | tee -a $LOG_FILE
      exit 0
      ;;
    * )
      echo "flag must be --install, or --print-host-info" 2>&1 | tee -a $LOG_FILE
      exit 1
      ;;
  esac
else
  echo "Illegal number of arguments" 2>&1 | tee -a $LOG_FILE
  exit 1
fi