#!/bin/sh

DOMAIN=$1
INTERNAL_IP=$2

## Remove all zones in case they exists
rndc showzone ${DOMAIN} in dappmanager >/dev/null 2>&1 && rndc delzone ${DOMAIN} in dappmanager;
rndc showzone ${DOMAIN} in internal_domain >/dev/null 2>&1 && rndc delzone ${DOMAIN} in internal_domain;

## Add an upgradeable DOMAIN zone to 'dappmanager' view
rndc addzone ${DOMAIN} in dappmanager '{type master; file "/etc/bind/dappnode.io.hosts"; allow-update{ 172.33.1.7;}; };'

## Update the DOMAIN zone with the DOMAIN and its interal IP address
nsupdate << EOF
server 172.33.1.2
debug yes
zone ${DOMAIN}.
update delete ${DOMAIN}. A
update add ${DOMAIN}. 60 A $INTERNAL_IP
show
send
EOF

## Deleted the upgradeable DOMAIN zone from 'dappmanager' view
rndc delzone ${DOMAIN} in dappmanager

## Add the final DOMAIN zone to 'internal_domain' view
rndc addzone ${DOMAIN} in internal_domain '{type master; file "/etc/bind/dappnode.io.hosts"; };'