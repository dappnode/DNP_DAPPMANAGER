#!/bin/bash

# Script to check weather a reboot is required or not.

# Exit on error
set -e

if [ -f /var/run/reboot-required ]; then
  # print reboot required and pkgs that require reboot
  if [ -f /var/run/reboot-required.pkgs ]; then
    # put pkgs in a string comma separated, if is just 1 pkg, do not add comma
    pkgs=$(cat /var/run/reboot-required.pkgs | tr '\n' ',' | sed 's/,$//')
  fi
  echo -n "{\"rebootRequired\": true, \"pkgs\": \"${pkgs}\"}"
else
 echo -n "{\"rebootRequired\": false, \"pkgs\": \"\"}"
fi

exit 0