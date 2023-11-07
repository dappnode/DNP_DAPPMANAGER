#!/bin/bash

# This script will perform an update and upgrade of the system.

# Exit on error and any unset variables
set -e

# Set noninteractive frontend (useful for automated scripts)
export DEBIAN_FRONTEND=noninteractive

# Update the package list
sudo apt-get update -y

# Upgrade all installed packages
sudo apt-get -y upgrade

# Remove packages that are no longer required
sudo apt-get -y autoremove

# Clean up apt cache
sudo apt-get clean

# If the script hasn't exited by now, it was successful
echo "System update and upgrade were successful."
exit 0