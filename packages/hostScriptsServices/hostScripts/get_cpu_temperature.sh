#!/bin/bash

THERMAL_ZONE_DIRS="/sys/class/thermal/thermal_zone*"
HWMON_PATH="/sys/devices/pci0000:00/*/hwmon/hwmon*/temp1_input"

#Iterate through paths
for path in $THERMAL_ZONE_DIRS;do
    if [ -e "$path/type" ] && [ -e "$path/temp" ]; then
        temp=$(paste <(cat $THERMAL_ZONE_DIRS/type 2>/dev/null) <(cat $THERMAL_ZONE_DIRS/temp 2>/dev/null) 2>/dev/null | column -s $'\t' -t | sed 's/\(.\)..$/.\1/')
        echo "$temp" | grep -E "x*_pkg_temp" | awk '{print $NF}'
        exit 0
    fi
done

#Iterate through paths
for path in $HWMON_PATH;do
    if [ -e "$path" ]; then
        temp=$(cat /sys/devices/pci0000:00/*/hwmon/hwmon*/temp1_input | sed 's/\(.\)..$/.\1/')
        echo $temp
        exit 0
    fi
done

#If cannot get the temperature
exit 1
