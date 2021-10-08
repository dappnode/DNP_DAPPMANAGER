#!/bin/bash

# Exit on error
set -e

###############
## VARIABLES ##
###############

LOG_DIR="/usr/src/dappnode/logs"
LOG_FILE="$LOG_DIR/lvm.log"
DATE=$(date)

###############
## FUNCTIONS ##
###############

function create_log_file () {
  mkdir -p $LOG_DIR
  echo -e "\e[32mStarting engine update: $DATE\e[0m" >> $LOG_FILE
}

function check_requirements () {
  # 1.Commands available
  lsblk -v 2>/dev/null || { echo "Error: command lsblk not found" | tee -a $LOG_FILE; exit 1; }
  lvdisplay -v 2>/dev/null || { echo "Error: command lvdisplay not found" | tee -a $LOG_FILE; exit 1; }
  pvs -v 2>/dev/null || { echo "Error: command pvs not found" | tee -a $LOG_FILE; exit 1; }
  vgs -v 2>/dev/null || { echo "Error: command vgs not found" | tee -a $LOG_FILE; exit 1; }
  lvs -v 2>/dev/null || { echo "Error: command lvs not found" | tee -a $LOG_FILE; exit 1; }
  # 2. LVM is on host
  [ ! $(lvdisplay) ] && { echo "Error: LVM is not on host" | tee -a $LOG_FILE; exit 1; }
}

# Extends the space of the dappnode LVM with a given hard disk
# Must be called with the arguments:
#   1) hard disk name
#   2) Volume Group name
#   3) Logical Volume name
function extend_lvm () {
  # 1. Check given args exists
  # Hard disk
  [ -f "/dev/${1}" ] || { echo "Error: Hard disk ${1} not found" | tee -a $LOG_FILE; exit 1; }
  # Volume group
  vgs | grep -q "$2" || { echo "Error: Volume group ${2} not found" | tee -a $LOG_FILE; exit 1; }
  # Logical volume
  lvs | grep -q "$3" || { echo "Error: Logical volume ${3} not found" | tee -a $LOG_FILE; exit 1; }
  # 2. Create pv
  pvcreate "/dev/${1}"
  # 3. Extend vg
  vgextend "$2" "/dev/${1}"
  # 4. Extend lv
  lvextend -l +100%FREE "/dev/${2}/${3}"
  # 5. Resize fs
  resize2fs -p "/dev/${2}/${3}"
  # 6. LVM extension check
}

# Returns an array of disks detected in the dappnode
function get_hard_disks () {
  # lsblk - list block devices
  # -e 7: exclude loops. The major node type of a loop block device is 7
  # -n: Print without headings
  # -d: Do not print slave/holders
  # -o NAME: Prints only NAME column
  # ALTERNATIVES: fdisk | parted
  DISKS=$(lsblk -e 7 -nd -o NAME)
}

function get_l

##########
## MAIN ##
##########

create_log_file

if [[ $# -eq 1 ]]; then
  flag="$1"
  case "${flag}" in
    --disks )
      get_hard_disks
      echo "$DISKS"
      exit 0
    --extend )
      check_requirements
      extend_lvm
      echo "Successfully extended LVM disk space" | tee -a $LOG_FILE
      exit 0
      ;;
    --reduce )
      check_requirements
      echo "Successfully reduced LVM disk space" | tee -a $LOG_FILE
      exit 0
      ;;
    * )
      echo "flag must be --extend, or --reduce" | tee -a $LOG_FILE
      exit 1
      ;;
  esac
else
  echo "Illegal number of arguments" | tee -a $LOG_FILE
  exit 1
fi