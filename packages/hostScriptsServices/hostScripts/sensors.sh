#!/bin/bash

# Check if sensors command is available
if ! command -v sensors &> /dev/null
then
    #echo "sensors command could not be found. Installing lm-sensors."

    sudo apt-get update

    # Install lm-sensors
    sudo apt-get install lm-sensors

    #echo "Installation complete."
fi

# Run sensors to display temperatures of the cpu cores
sensors -j