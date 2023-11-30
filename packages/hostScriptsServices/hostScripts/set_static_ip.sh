#!/bin/bash

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <IP_address> <Gateway>"
    exit 1
fi

NETWORK_DIR="/etc/network"
newIP=$1
newGateway=$2

#Get interface name
interface=$(ip route list | awk '/^default/ {print $5}')
#ip=$(ip -o -f inet addr show $default_if | awk '{print $4}')

# Static IP Configuration
staticIPConfig="
auto $interface
iface $interface inet static
    address $newIP       
    gateway $newGateway         
"

# Backup the original interfaces file
sudo cp $NETWORK_DIR/interfaces $NETWORK_DIR/interfaces.backup

# Write the static IP configuration
echo "$staticIPConfig" | sudo tee /tmp/temp_net_conf > /dev/null
sudo mv /tmp/temp_net_conf $NETWORK_DIR/interfaces

sudo systemctl restart networking

echo "Static IP address configured successfully."
exit 0
