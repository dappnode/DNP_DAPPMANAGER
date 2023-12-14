#!/bin/bash

# Check arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 <IP_address>"
    exit 1
fi

#Function to check if an address is inside a network
is_ip_in_network() {

    #Check ipcalc is installed, if not install it
    if ! command -v ipcalc &> /dev/null;then
        sudo apt update
        sudo apt install -y ipcalc
    fi

    IP=$1
    NETWORK=$2

    # Extracting network and netmask from the network argument
    NET_ADDR=$(echo $NETWORK | cut -d'/' -f1)
    NETMASK=$(ipcalc -n -b $NETWORK | grep Netmask | cut -d' ' -f2)

    # Use ipcalc to check if the IP is within the network
    RESULT=$(ipcalc -n $IP $NETMASK)

    if echo $RESULT | grep -q "Network: $NET_ADDR"; then
        return 0
    else
        return 1
    fi
}

TEST_SERVER="8.8.8.8"
NETWORK_DIR="/etc/network"
newIp=$1

#Get interface name, gateway and network address
interface=$(ip route list | awk '/^default/ {print $5}')
gateway=$(ip route show default | awk '/default/ {print $3}')
network_address=$(ip -o -4 route show dev $interface | awk '/proto kernel/ {print $1}')
echo "$network_address"

#Check if ip is inside the network
if ! is_ip_in_network $newIp $network_address; then
    echo "Ip address is not in the network"
    exit 1
fi

# Static IP Configuration
staticIPConfig="
auto $interface
iface $interface inet static
    address $newIp      
    gateway $gateway         
"

# Backup the original interfaces file
sudo cp $NETWORK_DIR/interfaces $NETWORK_DIR/interfaces.backup

# Write the static IP configuration
echo "$staticIPConfig" | sudo tee /tmp/temp_net_conf >/dev/null
sudo mv /tmp/temp_net_conf $NETWORK_DIR/interfaces

sudo systemctl restart networking

sleep 5

#Check network connectivity
if ping -c 1 "$TEST_SERVER" &>/dev/null; then
    echo "Static ip address configured successfully"
    exit 0
else
    #Revert to backup
    sudo mv $NETWORK_DIR/interfaces.backup $NETWORK_DIR/interfaces
    sudo systemctl restart networking
    echo "Could not set the ip address"
    exit 1
fi

