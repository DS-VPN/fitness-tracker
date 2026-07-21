#!/usr/bin/env bash
#
# fitness-tracker.sh — Proxmox VE LXC installer for Fitness Tracker, styled after the
# community-scripts.org (Proxmox VE Helper-Scripts) installers: the same banner/spinner/
# msg_info-msg_ok look, the same "Default vs Advanced Install" whiptail menu, and the
# same update convention (re-run this exact script *inside* the container to update it).
#
# It's a standalone script rather than `source <(curl ... community-scripts/.../build.func)`
# on purpose: that framework always fetches app installers from ITS OWN github.com/
# community-scripts/ProxmoxVE catalog — there's no supported way to point it at a
# different repo's install script. Since Fitness Tracker isn't (yet) in that catalog,
# this vendors the same look and flow as a self-contained script instead.
#
# Usage — on the Proxmox VE host, as root:
#
#   ./proxmox/fitness-tracker.sh
#
# or, if you haven't cloned the repo onto the host yet (works once this repo is public,
# or with a token embedded in the URL — see the README's Proxmox section):
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/DS-X256/fitness-tracker/main/proxmox/fitness-tracker.sh)"
#
# To update an existing install later, run this SAME command again — but *inside* the
# container (`pct enter <CTID>`, or ssh in), not on the host. It detects it's running
# inside the LXC (no `pveversion`) and pulls + rebuilds instead of creating a new one.
#
# Overridable via environment variables set before running:
#   REPO_URL   — git remote to clone/pull (default: this repo)
#   APP_DIR    — install path inside the container (default: /opt/fitness-tracker)
#   APP_PORT   — port the app listens on (default: 3000)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/DS-X256/fitness-tracker.git}"
APP_DIR="${APP_DIR:-/opt/fitness-tracker}"
APP_PORT="${APP_PORT:-3000}"
RAW_INSTALL_URL="https://raw.githubusercontent.com/DS-X256/fitness-tracker/main/proxmox/install/fitness-tracker-install.sh"
APP="Fitness Tracker"

# ------------------------------------------------------------------------------------
# Look & feel (trimmed, self-contained port of community-scripts.org's core.func)
# ------------------------------------------------------------------------------------
YW=$(printf '\033[33m'); GN=$(printf '\033[1;92m'); RD=$(printf '\033[01;31m')
BGN=$(printf '\033[4;92m'); CL=$(printf '\033[m')
BFR="\\r\\033[K"; BOLD=$(printf '\033[1m'); TAB="  "
CM="${TAB}\xE2\x9C\x94${TAB}"; CROSS="${TAB}\xE2\x9C\x96${TAB}"
INFO="${TAB}\xF0\x9F\x92\xA1${TAB}${CL}"; CREATING="${TAB}\xF0\x9F\x9A\x80${TAB}${CL}"
GATEWAY="${TAB}\xF0\x9F\x8C\x90${TAB}${CL}"

SPINNER_PID=""
SPINNER_MSG=""
spinner() {
	local chars="/-\\|" i=0
	while true; do
		printf "\r\033[2K%s %s" "${YW}${chars:$((i++ % ${#chars})):1}${CL}" "${YW}${SPINNER_MSG}${CL}"
		sleep 0.1
	done
}
stop_spinner() {
	if [[ -n "$SPINNER_PID" ]]; then
		kill "$SPINNER_PID" >/dev/null 2>&1 || true
		wait "$SPINNER_PID" 2>/dev/null || true
	fi
	SPINNER_PID=""
}
msg_info() {
	stop_spinner
	SPINNER_MSG="$1"
	spinner &
	SPINNER_PID=$!
	disown "$SPINNER_PID" 2>/dev/null || true
}
msg_ok() {
	stop_spinner
	printf "${BFR}${CM}${GN}%s${CL}\n" "$1"
}
msg_error() {
	stop_spinner
	printf "${BFR}${CROSS}${RD}%s${CL}\n" "$1" >&2
}
trap 'msg_error "Aborted on line $LINENO: $BASH_COMMAND"; exit 1' ERR
trap 'stop_spinner' EXIT

header_info() {
	clear
	cat <<"EOF"
    __ _ _                       _              _
   / _(_) |_ _ __   ___  ___ ___  | |_ _ __ __ _  ___| | _____ _ __
  | |_| | __| '_ \ / _ \/ __/ __| | __| '__/ _` |/ __| |/ / _ \ '__|
  |  _| | |_| | | |  __/\__ \__ \ | |_| | | (_| | (__|   <  __/ |
  |_| |_|\__|_| |_|\___||___/___/  \__|_|  \__,_|\___|_|\_\___|_|
EOF
	echo -e "${BOLD}  Proxmox VE LXC installer  —  community-scripts.org style${CL}\n"
}

exit_script() {
	clear
	echo -e "\n${CROSS}Installation cancelled by user.\n"
	exit 1
}

require_number() {
	local label="$1" value="$2"
	[[ "$value" =~ ^[0-9]+$ ]] || { msg_error "$label must be a whole number (got '$value')."; exit 1; }
}

# ------------------------------------------------------------------------------------
# Host sanity checks (mirrors root_check / pve_check)
# ------------------------------------------------------------------------------------
root_check() {
	[[ "$(id -u)" -eq 0 ]] || { msg_error "This script must be run as root."; exit 1; }
}
pve_check() {
	command -v pveversion >/dev/null 2>&1 || { msg_error "This must run on a Proxmox VE host (pveversion not found)."; exit 1; }
	command -v pct >/dev/null 2>&1 || { msg_error "pct not found — is this really a Proxmox VE host?"; exit 1; }
}

# ------------------------------------------------------------------------------------
# Settings — Default vs Advanced, same two-step whiptail flow as the real scripts
# ------------------------------------------------------------------------------------
CTID=""
CT_HOSTNAME="fitness-tracker"
DISK_SIZE=8
CORES=2
RAM=1024
BRIDGE="vmbr0"
NET_CONF="dhcp"
STORAGE=""
UNPRIVILEGED=1

default_settings() {
	CTID=$(pvesh get /cluster/nextid)
	STORAGE=$(pvesm status -content rootdir | awk 'NR==2 {print $1}')
	[[ -n "$STORAGE" ]] || { msg_error "No storage with 'rootdir' content found."; exit 1; }
	echo -e "${INFO}Using Default Settings"
}

advanced_settings() {
	CTID=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Container ID" 8 58 "$(pvesh get /cluster/nextid)" --title "CONTAINER ID" 3>&1 1>&2 2>&3) || exit_script
	require_number "Container ID" "$CTID"

	CT_HOSTNAME=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Hostname" 8 58 "$CT_HOSTNAME" --title "HOSTNAME" 3>&1 1>&2 2>&3) || exit_script

	DISK_SIZE=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Disk size (GB)" 8 58 "$DISK_SIZE" --title "DISK SIZE" 3>&1 1>&2 2>&3) || exit_script
	require_number "Disk size" "$DISK_SIZE"

	CORES=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "CPU cores" 8 58 "$CORES" --title "CPU CORES" 3>&1 1>&2 2>&3) || exit_script
	require_number "CPU cores" "$CORES"

	RAM=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "RAM (MB)" 8 58 "$RAM" --title "RAM" 3>&1 1>&2 2>&3) || exit_script
	require_number "RAM" "$RAM"

	BRIDGE=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Bridge" 8 58 "$BRIDGE" --title "BRIDGE" 3>&1 1>&2 2>&3) || exit_script

	if whiptail --backtitle "Fitness Tracker LXC" --title "NETWORK" --yesno "Use DHCP for networking?" 8 58; then
		NET_CONF="dhcp"
	else
		NET_CONF=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Static IP config, e.g. 192.168.1.50/24,gw=192.168.1.1" 8 70 "" --title "STATIC IP" 3>&1 1>&2 2>&3) || exit_script
		[[ -n "$NET_CONF" ]] || { msg_error "Static IP config cannot be empty."; exit 1; }
	fi

	local storages
	storages=$(pvesm status -content rootdir | awk 'NR>1 {print $1}')
	[[ -n "$storages" ]] || { msg_error "No storage with 'rootdir' content found."; exit 1; }
	STORAGE=$(whiptail --backtitle "Fitness Tracker LXC" --inputbox "Storage (options: $(echo "$storages" | tr '\n' ' '))" 8 70 "$(echo "$storages" | head -1)" --title "STORAGE" 3>&1 1>&2 2>&3) || exit_script
	echo "$storages" | grep -qx "$STORAGE" || { msg_error "'$STORAGE' is not one of the available storages."; exit 1; }

	if whiptail --backtitle "Fitness Tracker LXC" --title "CONTAINER TYPE" --yesno "Unprivileged container? (recommended: Yes)" 8 58; then
		UNPRIVILEGED=1
	else
		UNPRIVILEGED=0
	fi

	echo -e "${INFO}Using Advanced Settings"
}

settings_menu() {
	local choice
	choice=$(whiptail --backtitle "Fitness Tracker LXC" --title "SETTINGS" --menu \
		"Choose an installation method:" 12 58 2 \
		"1" "Default Install" \
		"2" "Advanced Install" 3>&1 1>&2 2>&3) || exit_script

	case "$choice" in
	1) default_settings ;;
	2) advanced_settings ;;
	esac
}

# ------------------------------------------------------------------------------------
# Container creation (mirrors build_container)
# ------------------------------------------------------------------------------------
build_container() {
	if pct status "$CTID" &>/dev/null; then
		msg_error "Container $CTID already exists."
		exit 1
	fi

	msg_info "Refreshing template list"
	pveam update >/dev/null 2>&1 || true
	msg_ok "Refreshed template list"

	local template
	template=$(pveam available --section system | awk '{print $2}' | grep '^debian-12-standard' | sort -V | tail -1)
	[[ -n "$template" ]] || { msg_error "No debian-12-standard template found."; exit 1; }

	if ! pveam list local | grep -q "$template"; then
		msg_info "Downloading LXC template: $template"
		pveam download local "$template" >/dev/null
		msg_ok "Downloaded LXC template"
	fi

	msg_info "Creating LXC container"
	pct create "$CTID" "local:vztmpl/${template}" \
		-hostname "$CT_HOSTNAME" \
		-cores "$CORES" \
		-memory "$RAM" \
		-swap 512 \
		-rootfs "${STORAGE}:${DISK_SIZE}" \
		-net0 "name=eth0,bridge=${BRIDGE},ip=${NET_CONF},firewall=1" \
		-features "nesting=1,keyctl=1" \
		-unprivileged "$UNPRIVILEGED" \
		-onboot 1 >/dev/null
	msg_ok "Created LXC container $CTID"

	msg_info "Starting container"
	pct start "$CTID" >/dev/null
	msg_ok "Started container"

	msg_info "Waiting for network"
	local i
	for i in $(seq 1 30); do
		pct exec "$CTID" -- sh -c 'command -v ip >/dev/null && ip -4 addr show dev eth0 | grep -q "inet "' &>/dev/null && break
		[[ $i -eq 30 ]] && { msg_error "Container never came up with an IP address."; exit 1; }
		sleep 2
	done
	msg_ok "Network is up"
}

get_container_ip() {
	pct exec "$CTID" -- sh -c "ip -4 addr show dev eth0 | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'" | head -1
}

# ------------------------------------------------------------------------------------
# Push + run the install script inside the container
# ------------------------------------------------------------------------------------
run_install_script() {
	local script_dir local_install install_script fetched=0
	script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
	local_install="${script_dir}/install/fitness-tracker-install.sh"

	if [[ -f "$local_install" ]]; then
		install_script="$local_install"
	else
		msg_info "Fetching install script"
		install_script=$(mktemp)
		fetched=1
		curl -fsSL "$RAW_INSTALL_URL" -o "$install_script"
		msg_ok "Fetched install script"
	fi

	pct push "$CTID" "$install_script" /root/fitness-tracker-install.sh
	[[ "$fetched" -eq 1 ]] && rm -f "$install_script"
	pct exec "$CTID" -- env REPO_URL="$REPO_URL" APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" \
		bash /root/fitness-tracker-install.sh
	pct exec "$CTID" -- rm -f /root/fitness-tracker-install.sh
}

description() {
	local ip
	ip=$(get_container_ip)
	pct set "$CTID" --description "# Fitness Tracker

App: http://${ip}:${APP_PORT}
App dir (inside container): ${APP_DIR}
" >/dev/null 2>&1 || true

	echo -e "\n${CREATING}${GN}${APP} setup has been successfully initialized!${CL}"
	echo -e "${GATEWAY}${BGN}http://${ip}:${APP_PORT}${CL}"
	echo -e "${INFO}${YW}Open that URL and use \"Create one\" to make your first account — accounts are self-service, no shared password to configure.${CL}"
	echo -e "${INFO}${YW}To update later: run this same script again, but INSIDE the container (pct enter ${CTID}).${CL}\n"
}

# ------------------------------------------------------------------------------------
# Update path — runs when this script is executed *inside* the container
# ------------------------------------------------------------------------------------
update_script() {
	header_info
	root_check
	[[ -d "$APP_DIR" ]] || { msg_error "$APP_DIR not found — this doesn't look like a Fitness Tracker container."; exit 1; }

	msg_info "Pulling latest code"
	git -C "$APP_DIR" pull --ff-only >/dev/null
	msg_ok "Pulled latest code"

	msg_info "Rebuilding and restarting (docker compose up -d --build)"
	(cd "$APP_DIR" && docker compose up -d --build) >/dev/null
	msg_ok "Rebuilt and restarted"

	msg_ok "Update complete!"
	exit 0
}

# ------------------------------------------------------------------------------------
# Entry point
# ------------------------------------------------------------------------------------
header_info

if command -v pveversion >/dev/null 2>&1; then
	root_check
	pve_check
	if ! command -v whiptail >/dev/null 2>&1; then
		msg_info "Installing whiptail"
		apt-get install -y -qq whiptail >/dev/null
		msg_ok "Installed whiptail"
	fi
	settings_menu
	build_container
	run_install_script
	description
else
	update_script
fi
