#!/bin/bash
set -euo pipefail

reboot_required=false
pkgs=""
if [[ -f /var/run/reboot-required ]]; then
  reboot_required=true
  if [[ -f /var/run/reboot-required.pkgs ]]; then
    pkgs=$(tr '\n' ',' < /var/run/reboot-required.pkgs | sed 's/,$//')
    pkgs=${pkgs//[^a-zA-Z0-9.+,:-]/}
  fi
fi

security_json=""
status_file=/usr/src/dappnode/DNCORE/security/cve-2026-98432.status
mitigation_script=/usr/local/lib/dappnode/mitigate_cve_2026_98432.sh
if [[ -f "$status_file" ]]; then
  state=failed
  if [[ -f "$mitigation_script" ]]; then
    state=$(/bin/bash "$mitigation_script" status 2>/dev/null) || state=failed
  elif [[ $(cat "$status_file") == not-applicable ]]; then
    state=not-applicable
  fi
  case "$state" in
    mitigated|failed|removed|not-applicable) ;;
    *) state=failed ;;
  esac
  security_json=",\"kernelSecurityMitigation\":\"$state\""
fi
printf '{"rebootRequired":%s,"pkgs":"%s"%s}' "$reboot_required" "$pkgs" "$security_json"
