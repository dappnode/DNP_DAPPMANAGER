#!/bin/bash

# Exit on error
set -e

###########
#VARIABLES#
###########

LOG_DIR="/usr/src/dappnode/logs"
LOG_FILE="$LOG_DIR/avahi_daemon.log"
DATE=$(date)

HOSTNAME=$(hostname)
AVAHI_IS_INSTALLED=false
AVAHI_IS_RUNNING=false
AVAHI_IS_ENABLED=false
AVAHI_RESOLVES=false

#LOCAL_IP=$(hostname -I | grep -Eo '192.168.[0-9]{1,3}.[0-9]{1,3}')
# AVAHI_IS_WRONG_IP=false

###########
#FUNCTIONS#
###########

function create_log_file () {
  mkdir -p $LOG_DIR
  echo -e "\e[32mStarting AVAHI daemon: $DATE\e[0m" >> $LOG_FILE
}

create_log_file


# Check avahi installed
function check_avahi_installed () {
    type avahi-daemon &>/dev/null && type avahi-resolve &>/dev/null && type avahi-publish &>/dev/null && AVAHI_IS_INSTALLED=true || AVAHI_IS_INSTALLED=false
}

# Install avahi
function install_avahi () {
    # This package contains several utilities that allow you to interact with the Avahi daemon, including publish, browsing and discovering services.
    # https://packages.debian.org/unstable/avahi-utils
    apt-get install avahi-utils &>/dev/null
}

# Edit avahi-daemon.conf if hostname !== dappnode
function edit_avahi_conf () {
    
}

# Start and enable on boot avahi-daemon
function start_avahi () {
  systemctl start avahi-daemon.service &>/dev/null && systemctl start avahi-daemon.socket &>/dev/null && \
  systemctl enable avahi-daemon.service &>/dev/null && systemctl enable avahi-daemon.socket &>/dev/null || \
  echo "Error starting avahi" && exit 1
}

# Stop and disable on boot avahi daemon
function stop_avahi () {
    # To stop avahi daemon is necessary to stop also the socket
    # Warning: Stopping avahi-daemon.service, but it can still be activated by: avahi-daemon.socket
    systemctl stop avahi-daemon.service &>/dev/null && systemctl stop avahi-daemon.socket &>/dev/null && \
    systemctl disable avahi-daemon.service &>/dev/null && systemctl disable avahi-daemon.socket &>/dev/null || \
    echo "Error stopping avahi" && exit 1
}

# Restart avahi-daemon
function restart_avahi () {
    systemctl restart avahi-daemon.service &>/dev/null || echo "Error restarting avahi" && exit 1
}

# Check avahi-daemon
function check_avahi_status () {
    [ "$(systemctl is-active avahi-daemon.service)" = "active" ] && AVAHI_IS_RUNNING=true
    [ "$(systemctl is-enabled avahi-daemon.service)" = "enabled" ] && AVAHI_IS_ENABLED=true
    avahi-resolve -n dappnode.local && AVAHI_RESOLVES=true &>/dev/null || AVAHI_RESOLVES=false
    # might be interesting to compare ip resolved to local ip found with $(hostname -I | grep -Eo '192.168.[0-9]{1,3}.[0-9]{1,3}')
}

#######################
###### MAIN LOOP ######
#######################

if [[ $# -eq 1 ]]; then
  flag="$1"
  case "${flag}" in
    --initialize )
      check_avahi_installed
      [ "${AVAHI_IS_INSTALLED}" = "false" ] && install_avahi
      [ "${HOSTNAME}" != "dappnode" ] && edit_avahi_conf
      check_avahi_status
      [ "${AVAHI_IS_RUNNING}" != "true" || "${AVAHI_IS_ENABLED}" != "true" ] && start_avahi
      [ "${AVAHI_RESOLVES}" != "true" ] && restart_avahi
      echo "Initialized AVAHI daemon" | tee -a $LOG_FILE
      exit 0
      ;;
    --status )
      check_avahi_status
      echo -n "{\"isAvahiRunning\": \"${AVAHI_IS_RUNNING}\", \"isAvahiEnabled\": \"${AVAHI_IS_ENABLED}\", \"avahiResolves\": \"${AVAHI_RESOLVES}\"}" | tee -a $LOG_FILE
      exit 0
      ;;
    --start )
      start_avahi
      echo "Started AVAHI daemon" | tee -a $LOG_FILE
      exit 0
      ;;
    --stop )
      stop_avahi
      echo "Stopped AVAHI daemon" | tee -a $LOG_FILE
      exit 0
      ;;
    --restart )
      restart_avahi
      echo "Restarted AVAHI daemon" | tee -a $LOG_FILE
      exit 0
      ;;
    * )
      echo "flag must be --initialize or --status" | tee -a $LOG_FILE
      exit 1
      ;;
  esac
else
  echo "Illegal number of arguments" | tee -a $LOG_FILE
  exit 1
fi