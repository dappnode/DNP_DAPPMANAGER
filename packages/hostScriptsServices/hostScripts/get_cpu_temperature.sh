#!/bin/bash

THERMAL_ZONE_DIRS="/sys/class/thermal/thermal_zone*"
HWMON_PATH="/sys/devices/pci0000:00/*/hwmon/hwmon*/temp1_input"

# The directory /sys/class/thermal/thermal_zone* contains the temperature values of some sensors
# The paste command search for that values and print the values and the type corresponding
# Using grep, takes only the temperature of the cpu
#Iterate through paths
for path in $THERMAL_ZONE_DIRS;do
    if [ -e "$path/type" ] && [ -e "$path/temp" ]; then
        temp=$(paste <(cat $THERMAL_ZONE_DIRS/type 2>/dev/null) <(cat $THERMAL_ZONE_DIRS/temp 2>/dev/null) 2>/dev/null | column -s $'\t' -t | sed 's/\(.\)..$/.\1/')
        echo "$temp" | grep -E "x*_pkg_temp" | awk '{print $NF}'
        exit 0
    fi
done


# If the first directory does not exist, search in another that contains the value of the cpu temp in a file
#Iterate through paths
for path in $HWMON_PATH;do
    if [ -e "$path" ]; then
        temp=$(cat $path | sed 's/\(.\)..$/.\1/')
        echo $temp
        exit 0
    fi
done

#In some cases, neither directory exists, cannot get temperature
exit 1
