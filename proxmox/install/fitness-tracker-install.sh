#!/usr/bin/env bash
#
# fitness-tracker-install.sh — runs INSIDE the LXC container, pushed and executed by
# ../fitness-tracker.sh. Styled after community-scripts.org's install/<app>-install.sh
# scripts: same msg_info/msg_ok output, same overall shape (update base system, install
# deps, deploy the app, clean up). Not meant to be run standalone on a machine you care
# about — it installs Docker system-wide and clones a repo into $APP_DIR.
#
# Expects these environment variables (fitness-tracker.sh always sets them; defaults
# below only matter if you run this file by hand for testing):
#   REPO_URL, APP_DIR, APP_PORT

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/DS-VPN/fitness-tracker.git}"
APP_DIR="${APP_DIR:-/opt/fitness-tracker}"
APP_PORT="${APP_PORT:-3000}"
INSTALL_LOG="/var/log/fitness-tracker-install.log"
: >"$INSTALL_LOG"

YW=$(printf '\033[33m'); GN=$(printf '\033[1;92m'); RD=$(printf '\033[01;31m'); CL=$(printf '\033[m')
BFR="\\r\\033[K"; TAB="  "
CM="${TAB}\xE2\x9C\x94${TAB}"; CROSS="${TAB}\xE2\x9C\x96${TAB}"

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
trap 'msg_error "Aborted on line $LINENO: $BASH_COMMAND — see $INSTALL_LOG for details"; exit 1' ERR
trap 'stop_spinner' EXIT

export DEBIAN_FRONTEND=noninteractive

msg_info "Updating base system"
apt-get update -qq >>"$INSTALL_LOG" 2>&1
apt-get -y -qq upgrade >>"$INSTALL_LOG" 2>&1
msg_ok "Updated base system"

msg_info "Checking network connectivity"
for i in 1 2 3 4 5; do
	getent hosts deb.debian.org >/dev/null 2>&1 && break
	[[ $i -eq 5 ]] && { msg_error "No network connectivity from inside the container."; exit 1; }
	sleep 2
done
msg_ok "Network is reachable"

msg_info "Installing dependencies (git, curl, ca-certificates)"
apt-get install -y -qq ca-certificates curl gnupg git >>"$INSTALL_LOG" 2>&1
msg_ok "Installed dependencies"

if command -v docker >/dev/null 2>&1; then
	msg_ok "Docker already installed"
else
	msg_info "Installing Docker"
	curl -fsSL https://get.docker.com | sh >>"$INSTALL_LOG" 2>&1
	systemctl enable --now docker >>"$INSTALL_LOG" 2>&1
	msg_ok "Installed Docker"
fi

if [[ -d "$APP_DIR/.git" ]]; then
	msg_info "Updating existing checkout at $APP_DIR"
	git -C "$APP_DIR" pull --ff-only >>"$INSTALL_LOG" 2>&1
	msg_ok "Updated existing checkout"
else
	msg_info "Cloning $REPO_URL"
	mkdir -p "$(dirname "$APP_DIR")"
	git clone --depth 1 "$REPO_URL" "$APP_DIR" >>"$INSTALL_LOG" 2>&1
	msg_ok "Cloned repository"
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
	msg_info "Writing .env"
	container_ip=$(hostname -I | awk '{print $1}')
	cp "$APP_DIR/.env.example" "$APP_DIR/.env"
	sed -i "s|^PORT=.*|PORT=${APP_PORT}|" "$APP_DIR/.env"
	sed -i "s|^ORIGIN=.*|ORIGIN=http://${container_ip}:${APP_PORT}|" "$APP_DIR/.env"
	msg_ok "Wrote .env"
else
	msg_ok ".env already present, leaving it untouched"
fi

msg_info "Building and starting the app (docker compose up -d --build)"
(cd "$APP_DIR" && docker compose up -d --build) >>"$INSTALL_LOG" 2>&1
msg_ok "App is up"

msg_info "Cleaning up"
apt-get autoremove -y -qq >>"$INSTALL_LOG" 2>&1
apt-get autoclean -y -qq >>"$INSTALL_LOG" 2>&1
msg_ok "Cleaned up"

{
	echo ""
	echo "Fitness Tracker"
	echo "  Directory: ${APP_DIR}"
	echo "  Port:      ${APP_PORT}"
	echo ""
} >>/etc/motd

msg_ok "Installation complete!"
