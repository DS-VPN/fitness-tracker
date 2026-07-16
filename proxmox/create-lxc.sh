#!/usr/bin/env bash
#
# create-lxc.sh — provisions a Debian LXC container on a Proxmox VE host, installs Docker
# inside it, clones this repo, and brings the fitness-tracker app up with docker compose.
#
# Run this ON THE PROXMOX HOST (as root), not inside a container:
#
#   ./create-lxc.sh
#
# or fetch-and-run directly from the host:
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/DS-VPN/fitness-tracker/main/proxmox/create-lxc.sh)"
#
# Everything below is configurable via environment variables set before running the script,
# e.g.:  CTID=150 HOSTNAME=fitness MEMORY=1024 ./create-lxc.sh
#
# If REPO_URL points at a private GitHub repo, `git clone` inside the container will need
# credentials — either make the repo public, use an SSH URL with a deploy key already on this
# Proxmox host (which gets copied into the container's known setup below), or bake a personal
# access token into the HTTPS URL (https://<token>@github.com/...) for this one-time clone.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration (override any of these as env vars before running the script)
# ---------------------------------------------------------------------------
CTID="${CTID:-$(pvesh get /cluster/nextid)}"
HOSTNAME="${HOSTNAME:-fitness-tracker}"
DISK_SIZE_GB="${DISK_SIZE_GB:-8}"
MEMORY_MB="${MEMORY_MB:-2048}"
SWAP_MB="${SWAP_MB:-512}"
CORES="${CORES:-2}"
BRIDGE="${BRIDGE:-vmbr0}"
# "dhcp" or a static config like "192.168.1.50/24,gw=192.168.1.1"
NET_IP="${NET_IP:-dhcp}"
STORAGE="${STORAGE:-}"
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"
TEMPLATE_PATTERN="${TEMPLATE_PATTERN:-debian-12-standard}"
REPO_URL="${REPO_URL:-https://github.com/DS-VPN/fitness-tracker.git}"
APP_DIR="${APP_DIR:-/opt/fitness-tracker}"
APP_PORT="${APP_PORT:-3000}"
UNPRIVILEGED="${UNPRIVILEGED:-1}"

log()  { echo -e "\033[1;32m[+]\033[0m $*"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
die()  { echo -e "\033[1;31m[x]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root on the Proxmox host."
command -v pct >/dev/null || die "pct not found — this must run on a Proxmox VE host."

if pct status "$CTID" &>/dev/null; then
	die "Container $CTID already exists. Set CTID=<a free id> and try again."
fi

# ---------------------------------------------------------------------------
# Pick a storage that can hold container rootdisks, if one wasn't specified
# ---------------------------------------------------------------------------
if [[ -z "$STORAGE" ]]; then
	STORAGE=$(pvesm status -content rootdir | awk 'NR==2 {print $1}')
	[[ -n "$STORAGE" ]] || die "No storage with 'rootdir' content found. Set STORAGE=<name> explicitly."
fi
log "Using storage: $STORAGE (template storage: $TEMPLATE_STORAGE)"

# ---------------------------------------------------------------------------
# Make sure a matching template is downloaded
# ---------------------------------------------------------------------------
log "Refreshing template list..."
pveam update >/dev/null

TEMPLATE=$(pveam available --section system | awk '{print $2}' | grep "^${TEMPLATE_PATTERN}" | sort -V | tail -1)
[[ -n "$TEMPLATE" ]] || die "No template matching '${TEMPLATE_PATTERN}' found via 'pveam available'."

if ! pveam list "$TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
	log "Downloading template $TEMPLATE..."
	pveam download "$TEMPLATE_STORAGE" "$TEMPLATE"
fi

# ---------------------------------------------------------------------------
# Create and start the container
# ---------------------------------------------------------------------------
log "Creating LXC $CTID ($HOSTNAME)..."
pct create "$CTID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
	-hostname "$HOSTNAME" \
	-cores "$CORES" \
	-memory "$MEMORY_MB" \
	-swap "$SWAP_MB" \
	-rootfs "${STORAGE}:${DISK_SIZE_GB}" \
	-net0 "name=eth0,bridge=${BRIDGE},ip=${NET_IP},firewall=1" \
	-features "nesting=1,keyctl=1" \
	-unprivileged "$UNPRIVILEGED" \
	-onboot 1

log "Starting container..."
pct start "$CTID"

log "Waiting for network..."
for i in $(seq 1 30); do
	if pct exec "$CTID" -- sh -c 'command -v ip >/dev/null && ip -4 addr show dev eth0 | grep -q "inet "' &>/dev/null; then
		break
	fi
	[[ $i -eq 30 ]] && die "Container never came up with an IP address. Check 'pct exec $CTID -- ip addr'."
	sleep 2
done

CONTAINER_IP=$(pct exec "$CTID" -- sh -c "ip -4 addr show dev eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'" | head -1)
log "Container IP: ${CONTAINER_IP:-unknown}"

# Extra readiness margin for DHCP/DNS to fully settle before apt-get.
for i in $(seq 1 15); do
	pct exec "$CTID" -- sh -c 'getent hosts deb.debian.org' &>/dev/null && break
	[[ $i -eq 15 ]] && warn "DNS not resolving yet inside the container — continuing anyway."
	sleep 2
done

# ---------------------------------------------------------------------------
# Install Docker + Compose, clone the repo, and bring the app up
# ---------------------------------------------------------------------------
log "Installing Docker inside the container (this takes a minute)..."
pct exec "$CTID" -- bash -c '
	set -e
	export DEBIAN_FRONTEND=noninteractive
	apt-get update -qq
	apt-get install -y -qq ca-certificates curl gnupg git >/dev/null
	curl -fsSL https://get.docker.com | sh >/dev/null
	systemctl enable --now docker >/dev/null
'

log "Cloning $REPO_URL into ${APP_DIR}..."
pct exec "$CTID" -- git clone --depth 1 "$REPO_URL" "$APP_DIR"

log "Generating .env..."
pct exec "$CTID" -- bash -c "
	set -e
	cd '${APP_DIR}'
	cp .env.example .env
	sed -i 's|^PORT=.*|PORT=${APP_PORT}|' .env
	sed -i 's|^ORIGIN=.*|ORIGIN=http://${CONTAINER_IP}:${APP_PORT}|' .env
"

log "Building and starting the app (docker compose up -d --build)..."
pct exec "$CTID" -- bash -c "cd '${APP_DIR}' && docker compose up -d --build"

cat <<EOF

--------------------------------------------------------------------
 Fitness Tracker is up in LXC $CTID ($HOSTNAME)

   URL:        http://${CONTAINER_IP}:${APP_PORT}
   App dir:    ${APP_DIR} (inside the container)
   .env:       ${APP_DIR}/.env (edit ORIGIN if you'll reach it via a
               Tailscale hostname instead of this LAN IP, then
               'docker compose up -d' again to apply it)

 Open the URL above and use "Create one" to make your first account
 — there's no shared password anymore, everyone signs up their own.

 Enter the container any time with:  pct enter $CTID
--------------------------------------------------------------------
EOF
