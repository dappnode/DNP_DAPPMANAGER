#!/bin/bash
#
# Script to detect and list possible mountpoints to be used in DAppNode as bind volumes.
#

IFS=$'\n'
echo -n "["
for line in $(df -hlPT | grep ^/); do
  if [[ ! $line =~ \/$ ]] && [[ ! $line == *"/boot"* ]]; then
    mountpoint=$(echo "$line" | awk '{ print $7 }')
    use=$(echo "$line" | awk '{ print $6 }')
    free=$(echo "$line" | awk '{ print $5 }')
    partition=$(echo "$line" | awk '{ print $1 }' | xargs basename)
    device="$(readlink -f "/sys/class/block/$partition/.." | xargs basename || true)"
    model="$(lsblk -no MODEL /dev/$device 2> /dev/null | sed -e 's/[[:space:]]*$//' || true)"
    vendor="$(lsblk -no VENDOR /dev/$device 2> /dev/null | sed -e 's/[[:space:]]*$//' || true)"
	  # print in JSON format
	  [[ "$NEXT" != "true" ]] || echo -n ","
    echo -n "{\"mountpoint\": \"$mountpoint\", \"use\": \"$use\", \"free\": \"$free\", \"vendor\": \"$vendor\", \"model\": \"$model\"}"
	  NEXT=true
  fi
done
echo "]"