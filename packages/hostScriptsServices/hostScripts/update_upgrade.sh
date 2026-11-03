#!/bin/bash

# This script will perform an update and upgrade of the system.
set -Eeuo pipefail

# Set noninteractive frontend (useful for automated scripts)
export DEBIAN_FRONTEND=noninteractive

# Update the package list
apt-get -o APT::Update::Error-Mode=any update

# Upgrade all installed packages
apt-get -o DPkg::Lock::Timeout=300 -y --with-new-pkgs upgrade

# Keep previous kernels available for recovery until the user has rebooted.

# Clean up apt cache
apt-get clean

# If the script hasn't exited by now, it was successful
echo "System update and upgrade were successful."
exit 0
