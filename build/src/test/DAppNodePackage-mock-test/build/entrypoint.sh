#!/bin/bash

FILE=/usr/config.json

echo " "
echo "Hello, ${VARIABLE:-no-name}"
echo " "

if test -f "$FILE"; then
    echo "Your config file:"
    cat $FILE
else
    echo "No config file found"
fi

echo " "

sleep 100000
