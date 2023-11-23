#!/bin/bash

# Execute the first command
output=$(paste <(cat /sys/class/thermal/thermal_zone*/type 2>/dev/null) <(cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null) 2>/dev/null | column -s $'\t' -t | sed 's/\(.\)..$/.\1/')
echo "$output" | grep -E "x*_pkg_temp" | awk '{print $NF}'

# Check if the output is empty or contains error message
if [ -z "$output" ] || [[ "$output" == *"No such file or directory"* ]]; then
    # If the first command fails, execute the second command
    output=$(cat /sys/devices/pci0000:00/*/hwmon/hwmon0/temp1_input | sed 's/\(.\)..$/.\1/')
    echo "$output"
fi
