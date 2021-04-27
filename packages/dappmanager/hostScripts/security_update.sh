#!/bin/bash

# Exit on error
set -e

# VARIABLES
FILE_SOURCES_LIST="/etc/apt/sources.list"
FILE_SECURITY_SOURCES_LIST="/etc/apt/security.sources.list"
DOCKER_PACKAGES=($(dpkg --get-selections | grep -o 'docker-ce\s\|containerd.io\s\|docker-ce-cli\s'))
DOCKER_PACKAGES_LENGTH=${#DOCKER_PACKAGES[@]}
DOCKER_INSTALLATION_REPOSITORIES=false

##############
#1.PRE-UPDATE#
##############

# Prevent needrestart interactive mode
# If set to a non-empty value the apt-get(8) hook will not run needrestart after installing or updating packages.
export NEEDRESTART_SUSPEND=true

# Check docker exists
if ! command -v docker &> /dev/null; then
  echo "docker not installed"
  exit 1
fi

# Check installation method
if [[ "$DOCKER_PACKAGES_LENGTH" -eq 3 ]]; then
  DOCKER_INSTALLATION_REPOSITORIES=true
fi

# Check sources.list exist
if [ ! -f "$FILE_SOURCES_LIST" ]; then
  echo "$FILE_SOURCES_LIST does not exist"
  exit 1
fi

# Check security.sources.list does not exist
if [ -f "$FILE_SECURITY_SOURCES_LIST" ]; then
  echo "$FILE_SECURITY_SOURCES_LIST already exist"
  exit 1
fi

# Create security.sources.list
grep security "$FILE_SOURCES_LIST" | tee "$FILE_SECURITY_SOURCES_LIST" || echo "error creating file $FILE_SECURITY_SOURCES_LIST" && exit 1

# Prevent docker packages from been updated if docker installed via repositories
if [ "$DOCKER_INSTALLATION_REPOSITORIES" = true ] ; then
  for DOCKER_PACKAGE in "${DOCKER_PACKAGES[@]}"; do
    echo "${DOCKER_PACKAGE} hold" | sudo dpkg --set-selections
  done
fi

##################
#2.UPDATE-UPGRADE#
##################

apt-get update > /dev/null || echo "error on apt-get update" && exit 1
apt-get upgrade -y -o "Dir::Etc::SourceList=$FILE_SECURITY_SOURCES_LIST" > /dev/null || echo "error on apt-get upgrade" && exit 1

###############
#3.POSTUPGRADE#
###############

# Remove security-sources.list
rm -rf "$FILE_SECURITY_SOURCES_LIST"
# Put normal values on repositories
if [ "$DOCKER_INSTALLATION_REPOSITORIES" = true ] ; then
  for DOCKER_PACKAGE in "${DOCKER_PACKAGES[@]}"; do
    echo "${DOCKER_PACKAGE} install" | sudo dpkg --set-selections
  done
fi

###########
#4.RESTART#
###########

# Security UPDATE: https://www.debian.org/doc/manuals/securing-debian-manual/security-update.en.html
# - libraries: "Once you have executed a security update you might need to restart some of the system services.
# If you do not do this, some services might still be vulnerable after a security upgrade"
# - kernel: "If you are doing a security update which includes the kernel image you need to reboot the system 
# in order for the security update to be useful. Otherwise, you will still be running the old (and vulnerable) kernel image"

# Install needrestart: https://manpages.debian.org/testing/needrestart/needrestart.1.en.html
if ! command -v needrestart &> /dev/null: then
  apt-get install -y needrestart > /dev/null || echo "upgraded successfully, error installing needrestart" && exit 1
fi

# Restart required services
needrestart -r a -q > /dev/null || echo "upgraded succesfully, error restarting services" && exit 1

# Reboot if still needed
NEEDS_TO_BE_RESTARTED=$(needrestart -r l -q)
if [ ! -z "$NEEDS_TO_BE_RESTARTED" ]; then
  echo "some services need a reboot"
  reboot
fi
# NOTE: perl throw warmings on remote machines


