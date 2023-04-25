#!/bin/bash

# Exit on error
set -e

# Check if the required argument is provided
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <STATIC_IP>"
  exit 1
fi

STATIC_IP="$1"

if ! [[ ${STATIC_IP} =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; then
    echo "Invalid IPv4 address format. Please provide a valid IPv4 address."
    exit 1
fi


# Get the default Ethernet interface name
INTERFACE_NAME=$(ip -o -4 route show default | awk '{print $5}')

# TODO: Add the code here to set the static IP in the host machine (any Linux distribution)
# Disable DHCP if it is enabled
# Make the script as compatible as possible with all Linux distros

echo "Static IP address ${STATIC_IP} has been configured for the default Ethernet interface (${INTERFACE_NAME})."
exit 0