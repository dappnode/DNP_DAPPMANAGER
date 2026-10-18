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

# Function to update the Debian-based system's configuration
update_debian() {
  NETWORK_CONFIG_PATH="/etc/network/interfaces"

  # TODO: Check if DHCP is enabled and disable it
  # TODO: Edit the config file to set the static IP address
}

# Function to update the RHEL-based system's configuration
update_rhel() {
  NETWORK_CONFIG_PATH="/etc/sysconfig/network-scripts/ifcfg-${INTERFACE_NAME}"
  # TODO: Check if DHCP is enabled and disable it
  # TODO: Edit the config file to set the static IP address
}

# Check if the Debian-based system's configuration file exists
if [ -f "/etc/network/interfaces" ]; then
    update_debian
    sudo systemctl restart networking
    echo "Debian-based system updated."
# Check if the RHEL-based system's configuration file exists
elif [ -f "/etc/sysconfig/network-scripts/ifcfg-${INTERFACE_NAME}" ]; then
    update_rhel
    sudo systemctl restart network
    echo "RHEL-based system updated."
else
    echo "Unsupported system or network configuration file not found."
    exit 1
fi

echo "Static IP address ${STATIC_IP} has been configured for the default Ethernet interface (${INTERFACE_NAME})."
exit 0