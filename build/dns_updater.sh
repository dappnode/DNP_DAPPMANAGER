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
