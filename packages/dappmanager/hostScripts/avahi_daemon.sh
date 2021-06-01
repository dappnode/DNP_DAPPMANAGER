#!/bin/bash

# non-case sensitive (only available in bash)
shopt -s nocasematch

# Exit on error
set -e

#VARIABLES#
HOSTNAME=$(hostname)
LOCAL_IP=$(hostname -I | grep -Eo '192.168.[0-9]{1,3}.[0-9]{1,3}')
AVAHI_IS_INSTALLED=false
AVAHI_IS_RUNNING=false
AVAHI_IS_ENABLED=false
AVAHI_RESOLVES=false
# AVAHI_IS_WRONG_IP=false


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

#MAIN LOOP#