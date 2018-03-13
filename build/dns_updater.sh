#!/bin/sh

echo "server bind" > /tmp/nsupdate.txt
echo "debug yes" >> /tmp/nsupdate.txt
echo "zone eth." >> /tmp/nsupdate.txt
for container in $(docker inspect -f '{{.Name}};{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q -f "name=dnp_"))
do
    name=$(echo $container | awk -F ';' '{print $1}'| sed 's/dnp_//g'| tr -d '/_')
    ip=$(echo $container | awk -F ';' '{print $2}'| tr -d '/_')
    if [ ! -z "$ip" ]
    then
    	echo "update delete dnp.${name}.eth A" >> /tmp/nsupdate.txt
    	echo "update add dnp.${name}.eth 60 A ${ip}" >> /tmp/nsupdate.txt
    fi
done
echo "show" >> /tmp/nsupdate.txt
echo "send" >> /tmp/nsupdate.txt

nsupdate -v /tmp/nsupdate.txt
