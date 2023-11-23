#!/bin/bash

THERMAL_ZONE_DIRS="/sys/class/thermal/thermal_zone*"

# Execute the first command
temp=$(paste <(cat $THERMAL_ZONE_DIRS/type 2>/dev/null) <(cat $THERMAL_ZONE_DIRS/temp 2>/dev/null) 2>/dev/null | column -s $'\t' -t | sed 's/\(.\)..$/.\1/')
echo "$output" | grep -E "x*_pkg_temp" | awk '{print $NF}'

# Check if the output is empty or contains error message
if [ -z "$output" ] || [[ "$output" == *"No such file or directory"* ]]; then
    # If the first command fails, execute the second command
    output=$(cat /sys/devices/pci0000:00/*/hwmon/hwmon*/temp1_input | sed 's/\(.\)..$/.\1/')
    echo "$output"
fi
