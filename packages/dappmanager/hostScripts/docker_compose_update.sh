#!/bin/bash

# non-case sensitive (only available in bash)
shopt -s nocasematch

# Exit on error
set -e

# VARIABLES
LOG_DIR="/usr/src/dappnode/logs"
LOG_FILE="$LOG_DIR/docker_compose_update.log"
DATE=$(date)
STABLE_DOCKER_COMPOSE_VERSION="1.25.5" # Docker compose stable versions

function create_log_file () {
  mkdir -p $LOG_DIR
  echo -e "\e[32mStarting compose update: $DATE\e[0m" >> $LOG_FILE
}

create_log_file

function get_docker_compose_version() {
  echo -e "\e[32mRetrieving compose version\e[0m" >> $LOG_FILE
  # Check if docker compose exists
  if type docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker-compose version --short)
  else 
    echo "docker compose does not exist or not recognized" | tee -a $LOG_FILE
    exit 1
  fi
}

function get_docker_engine_version() {
  echo -e "\e[32mRetrieving docker engine version\e[0m" >> $LOG_FILE
  # Check if docker exists
  if type docker >/dev/null 2>&1; then
    DOCKER_SERVER_VERSION=$(docker version --format '{{.Server.Version}}')
  else 
    echo "docker does not exist or not recognized" | tee -a $LOG_FILE
    exit 1
  fi
}

function check_requirements() {
    echo -e "\e[32mChecking requirements\e[0m" >> $LOG_FILE
    # get DOCKER_SERVER_VERSION and DOCKER_CLI_VERSION
    get_docker_compose_version
    # check is same version
    if [[ "$DOCKER_COMPOSE_VERSION" == "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
      echo "docker compose version is stable" | tee -a $LOG_FILE
      exit 1
    fi

    # check is downgrade
    if $(dpkg --compare-versions ${STABLE_DOCKER_COMPOSE_VERSION} "lt" ${DOCKER_COMPOSE_VERSION}); then 
      echo "Illegal to downgrade docker compose" | tee -a $LOG_FILE
      exit 1
    fi
}

function install_docker_compose() {
  echo -e "\e[32mInstalling docker compose\e[0m" >> $LOG_FILE
  # URLs
  DCMP_URL="https://github.com/docker/compose/releases/download/${STABLE_DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"

  # Paths
  DCMP_PATH="/usr/local/bin"
  mkdir -p $DCMP_PATH

  # STEP 1: Download file
  wget -q -O "$DCMP_PATH/docker-compose" $DCMP_URL

  # Post installation
  chmod +x "$DCMP_PATH/docker-compose"
}

function post_install_check() {
  echo -e "\e[32mPost install check\e[0m" >> $LOG_FILE
  # Check version post installation equals stable compose version
  DOCKER_COMPOSE_POST_INSTALLATION=$(docker-compose version --short)
  if [[ "$DOCKER_COMPOSE_POST_INSTALLATION" != "$STABLE_DOCKER_COMPOSE_VERSION" ]]; then
    echo "Update unsucessfull, versions are not equal. Rebooting..." | tee -a $LOG_FILE
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
      install_docker_compose
      post_install_check
      echo "Updated docker compose to ${STABLE_DOCKER_COMPOSE_VERSION} successfully" | tee -a $LOG_FILE
      exit 0
      ;;
    --version )
      get_docker_compose_version
      get_docker_engine_version
      echo -n "{\"dockerComposeVersion\": \"${DOCKER_COMPOSE_VERSION}\", \"dockerServerVersion\": \"${DOCKER_SERVER_VERSION}\"}" | tee -a $LOG_FILE
      exit 0
      ;;
    * )
      echo "flag must be --install or --version" | tee -a $LOG_FILE
      exit 1
      ;;
  esac
else
  echo "Illegal number of arguments" | tee -a $LOG_FILE
  exit 1
fi