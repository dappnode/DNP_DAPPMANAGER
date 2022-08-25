#!/bin/bash

# VARIABLES
LOG_DIR="/usr/src/dappnode/logs"
LOG_FILE="$LOG_DIR/update.log"
DATE=$(date)
FILE_SOURCES_LIST="/etc/apt/sources.list"
DOCKER_PACKAGES=($(dpkg --get-selections | grep -o 'docker-ce\s\|containerd.io\s\|docker-ce-cli\s'))
DOCKER_PACKAGES_LENGTH=${#DOCKER_PACKAGES[@]}
DOCKER_INSTALLATION_REPOSITORIES=false

############
#0.LOG-FILE#
############

function create_log_file () {
  mkdir -p $LOG_DIR
  echo -e "\e[32mStarting security updates: $DATE\e[0m" >> $LOG_FILE
}

##############
#1.PRE-UPDATE#
##############

function pre_update () {
  echo -e "\e[32mPre update check\e[0m" >> $LOG_FILE 
  # Prevent needrestart interactive mode and debian frontend during upgrade: https://manpages.debian.org/testing/needrestart/needrestart.1.en.html
  export NEEDRESTART_SUSPEND=true # If set to a non-empty value the apt-get(8) hook will not run needrestart after installing or updating packages.
  export DEBIAN_FRONTEND=noninteractive

  # Check docker exists
  if ! command -v docker &> /dev/null; then
    echo "docker not installed" | tee -a $LOG_FILE 
    exit 1
  fi

  # Check installation method
  if [[ "$DOCKER_PACKAGES_LENGTH" -eq 3 ]]; then
    echo "docker installed through repositories" >> $LOG_FILE 
    DOCKER_INSTALLATION_REPOSITORIES=true
  else
    echo "docker installed through deb packages" >> $LOG_FILE 
  fi

  # Check sources.list exist
  if [ ! -f "$FILE_SOURCES_LIST" ]; then
    echo "$FILE_SOURCES_LIST does not exist" | tee -a $LOG_FILE 
    exit 1
  fi

  # Prevent docker packages from been updated if docker installed via repositories
  if [ "$DOCKER_INSTALLATION_REPOSITORIES" = true ] ; then
    echo -e "\e[32mEditing docker repositories\e[0m" >> $LOG_FILE 
    for DOCKER_PACKAGE in "${DOCKER_PACKAGES[@]}"; do
      echo "${DOCKER_PACKAGE} hold" | dpkg --set-selections
    done
  fi
}



##################
#2.UPDATE-UPGRADE#
##################

function update () {
  echo -e "\e[32mUpdating\e[0m" >> $LOG_FILE 

  apt-get update 2>&1 >> $LOG_FILE || { echo "error on apt-get update" | tee -a $LOG_FILE ; post_upgrade_clean ; exit 1; }
  echo -e "\e[32mUpgrading\e[0m" >> $LOG_FILE 
  apt-get upgrade -y 2>&1 >> $LOG_FILE || { echo "error on apt-get upgrade" | tee -a $LOG_FILE ; post_upgrade_clean ; exit 1; }
}

###############
#3.POSTUPGRADE#
###############

function post_upgrade_clean () {
  echo -e "\e[32mPost upgrade clean\e[0m" >> $LOG_FILE 
  # Put normal values on repositories
  if [ "$DOCKER_INSTALLATION_REPOSITORIES" = true ] ; then
    echo -e "\e[32mEditing docker repositories\e[0m" >> $LOG_FILE 
    for DOCKER_PACKAGE in "${DOCKER_PACKAGES[@]}"; do
      echo "${DOCKER_PACKAGE} install" | dpkg --set-selections
    done
  fi
}

###########
#4.RESTART#
###########

function post_upgrade_restart () {
  echo -e "\e[32mRestart services\e[0m" >> $LOG_FILE 
  # Security UPDATE: https://www.debian.org/doc/manuals/securing-debian-manual/security-update.en.html
  # - libraries: "Once you have executed a security update you might need to restart some of the system services.
  # If you do not do this, some services might still be vulnerable after a security upgrade"
  # - kernel: "If you are doing a security update which includes the kernel image you need to reboot the system 
  # in order for the security update to be useful. Otherwise, you will still be running the old (and vulnerable) kernel image"

  # Install needrestart: https://manpages.debian.org/testing/needrestart/needrestart.1.en.html
  if ! command -v needrestart &> /dev/null; then
    echo -e "\e[32mInstalling needrestart package\e[0m" >> $LOG_FILE 
    apt-get install -y needrestart 1>/dev/null 2>>$LOG_FILE || { echo "Security updates have been executed successfully, error installing needrestart" ; exit 1; }
  fi

  # Restart required services
  echo -e "\e[32mRestarting services\e[0m" >> $LOG_FILE 
  needrestart -r a -q 1>/dev/null 2>>$LOG_FILE || { echo "Security updates have been executed successfully, error restarting services" ; exit 1; }

  # Check if reboot needed
  NEEDS_TO_BE_RESTARTED=$(needrestart -r l -q) # Issue: perl throw warmings on remote machines
  if [ ! -z "$NEEDS_TO_BE_RESTARTED" ]; then
    echo -e "\e[33mSecurity updates have been executed successfully, a reboot is needed to implement such updates\e[0m" >> $LOG_FILE 
    echo "Security updates have been executed successfully, a reboot is needed to implement such updates"
    exit 0
  fi

  echo -e "\e[32mSecurity updates have been executed successfully, no reboot needed\e[0m" >> $LOG_FILE 
  echo "Security updates have been executed successfully, no reboot needed"
  exit 0
}

###########
#MAIN-LOOP#
###########
create_log_file
pre_update
update
post_upgrade_clean
post_upgrade_restart