#!/bin/bash

# Exit on error
set -e

# Check if nmcli exists
if ! type nmcli >/dev/null 2>&1; then
  echo "The nmcli command is not available. Attempting to install NetworkManager..."
  
  # Update package list and install NetworkManager
  sudo apt-get update
  sudo apt-get install -y network-manager

  # Check if nmcli is available after the installation
  if ! type nmcli >/dev/null 2>&1; then
    echo "NetworkManager installation failed. Please install NetworkManager manually and try again."
    exit 1
  fi
fi

# Check if the required argument is provided
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <STATIC_IP>"
  exit 1
fi

STATIC_IP="$1"