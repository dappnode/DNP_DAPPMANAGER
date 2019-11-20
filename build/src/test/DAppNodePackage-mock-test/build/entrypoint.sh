#!/bin/bash

FILE=/usr/config.json

echo " "
echo "Hello, ${NAME:-no-name}"
echo " "

if test -f "$FILE"; then
    echo "Your config file:"
    cat $FILE
else
    echo "No config file found"
fi

echo " "

exec nc -l -p 8888