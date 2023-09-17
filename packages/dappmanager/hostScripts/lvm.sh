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
  echo -e "\e[32mLVM: $DATE\e[0m" >> "$LOG_FILE"
}

function check_requirements () {
  # 1.Commands available
  lsblk --version &>/dev/null || { echo "Error: command lsblk not found" | tee -a "$LOG_FILE"; exit 1; }
  lvdisplay -v &>/dev/null || { echo "Error: command lvdisplay not found" | tee -a "$LOG_FILE"; exit 1; }
  pvs -v &>/dev/null || { echo "Error: command pvs not found" | tee -a "$LOG_FILE"; exit 1; }
  vgs -v &>/dev/null || { echo "Error: command vgs not found" | tee -a "$LOG_FILE"; exit 1; }
  lvs -v &>/dev/null || { echo "Error: command lvs not found" | tee -a "$LOG_FILE"; exit 1; }
  # 2. LVM is on host
  lvdisplay &>/dev/null || { echo "Error: LVM is not on host" | tee -a "$LOG_FILE"; exit 1; }
}

# Extends the space of the Dappnode LVM with a given hard disk
# Must be called with the arguments:
#   1) hard disk name
#   2) Volume Group name
#   3) Logical Volume name
function extend_disk () {
  echo "Extending disk space..." >> "$LOG_FILE"
  # 1. Check given args exists
  # Hard disk
  [ -b "/dev/${1}" ] || { echo "Error: Hard disk ${1} not found" | tee -a "$LOG_FILE"; exit 1; }
  # Volume group
  vgs --noheadings -o vg_name | grep -q "$2" || { echo "Error: Volume group ${2} not found" | tee -a "$LOG_FILE"; exit 1; }
  # Logical volume
  lvs --noheadings -o lv_name | grep -q "$3" || { echo "Error: Logical volume ${3} not found" | tee -a "$LOG_FILE"; exit 1; }
  # 2. Create pv
  pvcreate "/dev/${1}" -y &>> "$LOG_FILE"
  # 3. Extend vg
  vgextend "$2" "/dev/${1}" &>> "$LOG_FILE"
  # 4. Extend lv
  lvextend -l +100%FREE "/dev/${2}/${3}" &>> "$LOG_FILE"
  # 5. Resize fs
  resize2fs -p "/dev/${2}/${3}" &>> "$LOG_FILE"
  # 6. LVM extension check
}

# Returns disks names and its size detected in the Dappnode
# e.g {"blockdevices": [{"name":"sda", "size":"3.6T"},{"name":"nvme0n1", "size":"3.6T"}]}
function get_hard_disks () {
  # lsblk - list block devices
  # -e 7: exclude loops. The major node type of a loop block device is 7
  # -n: Print without headings
  # -d: Do not print slave/holders
  # --json: json format
  # -o NAME,SIZE: Prints only NAME and SIZE columns
  # ALTERNATIVES: fdisk | parted
  echo "Getting Hard Disks..." >> "$LOG_FILE"
  lsblk -e 7 -nd -o NAME,SIZE --json | tee -a "$LOG_FILE"
}

# Returns Volume groups (VG)
# e.g  {"report": [{"vg": [{"vg_name":"rootvg", "vg_size":"<3.64t"}]}]}
function get_vg () {
  echo "Getting Volumes Groups..." >> "$LOG_FILE"
  vgs --options=vg_name,vg_size --reportformat json | tee -a "$LOG_FILE"
}

# Returns Logical volumes (LV) 
# e.g {"report": [{"lv": [{"lv_name":"root", "vg_name":"rootvg", "lv_size":"<3.64t"},{"lv_name":"swap_1", "vg_name":"rootvg", "lv_size":"976.00m"}]}]}
function get_lv () {
  echo "Getting Logical Volumes..." >> "$LOG_FILE"
  lvs --options=lv_name,vg_name,lv_size --reportformat json | tee -a "$LOG_FILE"
}

##########
## MAIN ##
##########

create_log_file
flag="$1"
case "${flag}" in
  --get-disks )
    get_hard_disks
    exit 0
    ;;
  --get-lv )
    get_lv
    exit 0
    ;;
  --get-vg )
    get_vg
    exit 0
    ;;
  --extend )
    [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] && { echo "Error: hard disk or logical volume or volume group missing" | tee -a "$LOG_FILE"; exit 1; }
    check_requirements
    extend_disk "$2" "$3" "$4"
    echo "Successfully extended LVM disk space" | tee -a "$LOG_FILE"
    exit 0
    ;;
  --reduce )
    check_requirements
    echo "Successfully reduced LVM disk space" | tee -a "$LOG_FILE"
    exit 0
    ;;
  * )
    echo "flag must be --extend, --reduce, --get-disks, --get-vg or --get-lv" | tee -a "$LOG_FILE"
    exit 1
    ;;
esac
