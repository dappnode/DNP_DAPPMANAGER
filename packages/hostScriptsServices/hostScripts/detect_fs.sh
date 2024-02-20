#!/bin/bash
#
# Script to detect and list possible mountpoints to be used in Dappnode as bind volumes.
#

IFS=$'\n'
echo -n "["
for line in $(df -lPTB1 | grep ^/); do
  if [[ ! $line =~ \/$ ]] && [[ ! $line == *"/boot"* ]]; then
    mountpoint=$(echo "$line" | awk '{ print $7 }')
    use=$(echo "$line" | awk '{ print $6 }')
    free=$(echo "$line" | awk '{ print $5 }')
    used=$(echo "$line" | awk '{ print $4 }')
    total=$(echo "$line" | awk '{ print $3 }')
    partition=$(echo "$line" | awk '{ print $1 }' | xargs basename)
    link=$(readlink -f "/sys/class/block/$partition/..")
    if [ -z ${link+x} ]; then
      device="$(echo $link | xargs basename || true)"
    else
      device=true
    fi
    model="$(lsblk -no MODEL /dev/$device 2>/dev/null | sed -e 's/[[:space:]]*$//' || true)"
    vendor="$(lsblk -no VENDOR /dev/$device 2>/dev/null | sed -e 's/[[:space:]]*$//' || true)"

    # Detect devices mounted with usbmount, and grab a deterministic mount point
    usbmount_symlink=""
    if [ -d /run/usbmount ]; then
      usbmount_symlink=$(ls -1d /run/usbmount/* 2>/dev/null | xargs -I {} -i sh -c 'echo $(readlink -f "{}"):{}' | grep ${mountpoint} 2>/dev/null | cut -d":" -f2)
      if [ -n "${usbmount_symlink}" ]; then
        mountpoint="${usbmount_symlink}"
      fi
    fi

    # print in JSON format
    [[ "$NEXT" != "true" ]] || echo -n ","
    echo -n "{\"mountpoint\": \"$mountpoint\", \"use\": \"$use\", \"free\": \"$free\", \"used\": \"$used\", \"total\": \"$total\", \"vendor\": \"$vendor\", \"model\": \"$model\"}"
    NEXT=true
  fi
done
echo "]"
