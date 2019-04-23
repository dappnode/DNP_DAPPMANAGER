#!/bin/sh

echo "server 172.33.1.2" > /tmp/nsupdate.txt
echo "debug yes" >> /tmp/nsupdate.txt
echo "zone eth." >> /tmp/nsupdate.txt
for container in $(docker inspect -f '{{.Name}};{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q -f "name=DAppNodePackage-"))
do
    name=$(echo $container | awk -F ';' '{print $1}'| sed 's/DAppNodePackage-//g'| tr -d '/_')
    ip=$(echo $container | awk -F ';' '{print $2}'| tr -d '/_')
    if [ ! -z "$ip" ]
    then
    	echo "update delete my.${name} A" >> /tmp/nsupdate.txt
    	echo "update add my.${name} 60 A ${ip}" >> /tmp/nsupdate.txt
    fi
done
echo "show" >> /tmp/nsupdate.txt
echo "send" >> /tmp/nsupdate.txt

nsupdate -v /tmp/nsupdate.txt

echo "server 172.33.1.2" > /tmp/nsupdate_dappnode.txt
echo "debug yes" >> /tmp/nsupdate_dappnode.txt
echo "zone dappnode." >> /tmp/nsupdate_dappnode.txt
for container in $(docker inspect -f '{{.Name}};{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q -f "name=DAppNodePackage-"))
do
    name=$(echo $container | awk -F ';' '{print $1}'| sed 's/DAppNodePackage-//g'| sed 's/\.dappnode\.eth//g' |  sed 's/\.dnp//g' | tr -d '/_')
    ip=$(echo $container | awk -F ';' '{print $2}'| tr -d '/_')
    if [ ! -z "$ip" ]
    then
    	echo "update delete ${name}.dappnode A" >> /tmp/nsupdate_dappnode.txt
    	echo "update add ${name}.dappnode 60 A ${ip}" >> /tmp/nsupdate_dappnode.txt
    fi
done
echo "show" >> /tmp/nsupdate_dappnode.txt
echo "send" >> /tmp/nsupdate_dappnode.txt

nsupdate -v /tmp/nsupdate_dappnode.txt