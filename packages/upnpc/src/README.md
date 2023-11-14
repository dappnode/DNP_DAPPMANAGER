NAME

upnpc - interact with an external UPnP Internet Gateway Device
SYNOPSIS
setuc [ifn | cname] # Host interface to use

upnpc -a ip port external_port tcp | udp # Add port mapping
upnpc -d external_port tcp | udp # Delete port mapping
upnpc -e # External IP address
upnpc -i # Initialize device list
upnpc -s # Status
upnpc -l # List port mappings
upnpc -n ip # Get friendly name
upnpc -r port1 tcp | udp [...] # Map these ports to the host interface
