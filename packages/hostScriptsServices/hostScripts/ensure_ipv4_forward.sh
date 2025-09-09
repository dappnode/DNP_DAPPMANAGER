#!/bin/bash
# ensure_ipv4_forward.sh
# This script ensures that IPv4 forwarding is enabled on the system.

set -e
set -o pipefail


# Check if IPv4 forwarding is already enabled.
if sysctl net.ipv4.ip_forward | grep -q 'net.ipv4.ip_forward = 1'; then
    echo "IPv4 forwarding is already enabled."
    exit 0
fi

# If the configuration is already present in /etc/sysctl.conf or /etc/sysctl.d/, do not change it.
if grep -Eq '^[^#]*net\.ipv4\.ip_forward\s*=' /etc/sysctl.conf /etc/sysctl.d/* 2>/dev/null; then
    echo "Found existing IPv4 forwarding configuration. Exiting."
    exit 0
fi

# Enable IPv4 forwarding.
dest_file="/etc/sysctl.conf"
[ -d /etc/sysctl.d ] && dest_file="/etc/sysctl.d/99-tailscale.conf"

echo 'net.ipv4.ip_forward = 1' | tee -a $dest_file
sysctl -p $dest_file
echo "Added ipv4 forwarding configuration to $dest_file."