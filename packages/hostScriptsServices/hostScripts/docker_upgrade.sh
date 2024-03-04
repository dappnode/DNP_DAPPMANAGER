#!/bin/bash

# Use a switch to determine the action
#   --check: it will print a json with: eturns a json with the following properties {isDockerInstalledThroughApt: boolean, isDockerInUnattendedUpgrades: boolean, dockerHostVersion: string, dockerLatestVersion: string}
#   --upgrade: it will
#       0. Check if the internet and DNS are active
#       1. Get download urls depending on the OS
#       2. Install docker by removing legacy docker packages, setting up the repository, and installing docker-ce, docker-ce-cli, containerd.io, docker-buildx-plugin, and docker-compose-plugin (official docs)
#       3. Add Docker to unattended upgrades
#       4. Create an alias for docker-compose if it is not installed

# constants
export DEBIAN_FRONTEND=noninteractive
DOCKER_DOWNLOAD_ORIGINS="Docker:\${distro_codename}"
UNATTENDED_UPGRADES_FILE="/etc/apt/apt.conf.d/50unattended-upgrades"
LOG_FILE="/usr/src/dappnode/logs/docker_upgrade.log"

# Initialize variables
isDockerInstalledThroughApt=false
isDockerInUnattendedUpgrades=false
dockerHostVersion=""
dockerLatestVersion=""

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [docker_update.log]:  $1" | tee -a ${LOG_FILE}
}

# Get the current version of Docker
function getDockerHostVersion() {
    dockerHostVersion=$(docker version --format '{{.Server.Version}}' | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+')
}

# Get the latest version of Docker
function getDockerLatestVersion() {
    # docker latest version might be empty if docker is not installed through apt
    dockerLatestVersion=$(apt-cache madison docker-ce | head -n 1 | awk '{print $3}' | sed -E 's/^[0-9]+:([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
}

# Check if Docker is installed through apt
function getIsDockerInstalledThroughApt() {
    # Check if docker is installed via apt
    # The docker.list file is created by the docker installation script
    if [ -f /etc/apt/sources.list.d/docker.list ]; then
        isDockerInstalledThroughApt=true
    fi
}

# Check if Docker is in unattended upgrades
function getIsDockerInUnattendedUpgrades() {
    # Check if Docker is in unattended upgrades
    if ! grep -q "${DOCKER_DOWNLOAD_ORIGINS}" "${UNATTENDED_UPGRADES_FILE}"; then
        isDockerInUnattendedUpgrades=false
    else
        isDockerInUnattendedUpgrades=true
    fi
}

# check if docker-compose is installed and create an alias for docker compose if not
# this must only be done after upgrading docker, since docker-compose is a dependency of the older docker version
# DOCKER-COMPOSE FOR LEGACY SCRIPTS, SHOULD BE REMOVED EVENTUALLY
function aliasDockerCompose() {
    if docker-compose -v >/dev/null 2>&1; then
        log "docker-compose is already installed/aliased"
    else
        cat >/usr/local/bin/docker-compose <<EOL
#!/bin/bash
docker compose "\$@"
EOL
        chmod +x /usr/local/bin/docker-compose
    fi
}

# Add Docker to unattended upgrades
# this must only be done after upgrading docker, since docker must be installed through apt
function addDockerToUnattendedUpgrades() {
    # Check unattended upgrades is installed and enabled, if not, install it and enable it
    if ! dpkg -l | grep -q unattended-upgrades; then
        log "Unattended-upgrades is not installed, installing..."
        apt-get install -y unattended-upgrades 2>&1 | tee -a ${LOG_FILE}
        if [ $? -ne 0 ]; then
            log "Failed to install unattended-upgrades."
            exit 1
        fi
    fi

    getIsDockerInUnattendedUpgrades
    # Check that the UNATTENDED_upgrades_file exists if so, check that the file does not already contain the DOCKER_DOWNLOAD_ORIGINS, if not then modify it to include in the section Unattended-Upgrade::Allowed-Origins the docker download origins
    # check the var isDockerInUnattendedUpgrades to avoid adding the same line multiple times
    if [ $isDockerInUnattendedUpgrades = false ]; then
        sed -i "/Unattended-Upgrade::Allowed-Origins {/a \"${DOCKER_DOWNLOAD_ORIGINS}\";" "${UNATTENDED_UPGRADES_FILE}" 2>&1 | tee -a ${LOG_FILE}
    fi
}

# Get the download URLs for the Docker repository depending on the OS
function getDowloadUrls() {
    # Check the OS
    if type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
    elif [ -f /etc/os-release ]; then
        source /etc/os-release
        OS=$NAME
    elif [ -f /etc/lsb-release ]; then
        source /etc/lsb-release
        OS=$DISTRIB_ID
    elif [ -f /etc/debian_version ]; then
        OS=Debian
    else
        OS=$(uname -s)
    fi

    if echo "$OS" | grep -Ei "(Debian)" >/dev/null 2>&1; then
        DOWNLOAD_GPG_URL="https://download.docker.com/linux/debian/gpg"
        DOWNLOAD_REPO_URL="https://download.docker.com/linux/debian"
    elif echo "$OS" | grep -Ei "(Ubuntu)" >/dev/null 2>&1; then
        DOWNLOAD_GPG_URL="https://download.docker.com/linux/ubuntu/gpg"
        DOWNLOAD_REPO_URL="https://download.docker.com/linux/ubuntu"
    elif echo "$OS" | grep -Ei "(Raspbian)" >/dev/null 2>&1; then
        DOWNLOAD_GPG_URL="https://download.docker.com/linux/raspbian/gpg"
        DOWNLOAD_REPO_URL="https://download.docker.com/linux/raspbian"
    else
        log "OS $OS is not supported, skipping upgrade"
        exit 0
    fi
}

function internetAndDnsActive() {
    # Check if internet and DNS are active
    if ! ping -c 1 google.com >/dev/null 2>&1; then
        log "No internet connection"
        exit 1
    fi
}

# Installs docker AND migrate from pkg installation methid to apt
function installDocker() {
    # Remove legacy docker packages
    for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
        log "Removing $pkg"
        apt-get remove -y $pkg 2>&1 | tee -a ${LOG_FILE}
    done

    # Set up the repository
    log "Set up the repository"
    # 1. Update the apt package index and install packages to allow apt to use a repository over HTTPS
    log "Update the apt packages"
    apt-get update 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to update"
        exit 1
    fi
    log "Install ca-certificates curl and gnupg"
    apt-get install -y ca-certificates curl gnupg 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to install ca-certofocates curl and gnupg."
        exit 1
    fi
    # 2. Add Docker's official GPG key
    log "Add Docker's official GPG key"
    install -m 0755 -d /etc/apt/keyrings 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to create /etc/apt/keyrings directory."
        exit 1
    fi
    log "Download and install docker gpg key"
    curl -fsSL "${DOWNLOAD_GPG_URL}" -o /etc/apt/keyrings/docker.asc 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to download and install docker gpg key."
        exit 1
    fi
    log "Change permissions for docker asc key"
    chmod a+r /etc/apt/keyrings/docker.asc 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to change permissions for docker gpg key."
        exit 1
    fi
    # 3. Use the following command to set up the repository
    log "Add docker repository"
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] ${DOWNLOAD_REPO_URL} \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
        tee /etc/apt/sources.list.d/docker.list >/dev/null
    if [ $? -ne 0 ]; then
        log "Failed to add docker repository."
        exit 1
    fi

    # 1. Update the apt package index:
    log "Update the apt packages again"
    apt-get update 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to update"
        exit 1
    fi
    # IMPORTANT: This step MUST be skipped so unattended-upgrades will upgrade docker later on
    # MORE IMPORTANT: legacy docker-compose has as a dependency the older docker version
    # 2. Install Docker Engine, containerd, and Docker Compose.
    log "Install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
    apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y 2>&1 | tee -a ${LOG_FILE}
    if [ $? -ne 0 ]; then
        log "Failed to install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin."
        exit 1
    fi
    # 3. Verify that the Docker Engine installation is successful by running the hello-world image.
    #docker run --rm hello-world && docker rmi hello-world
}

case $1 in
--check)
    getDockerHostVersion
    getDockerLatestVersion
    getIsDockerInstalledThroughApt
    getIsDockerInUnattendedUpgrades
    echo -n "{\"isDockerInstalledThroughApt\": \"${isDockerInstalledThroughApt}\", \"isDockerInUnattendedUpgrades\": \"${isDockerInUnattendedUpgrades}\", \"dockerHostVersion\": \"${dockerHostVersion}\", \"dockerLatestVersion\": \"${dockerLatestVersion}\"}"
    ;;
--upgrade)
    internetAndDnsActive
    getDowloadUrls
    installDocker
    addDockerToUnattendedUpgrades
    aliasDockerCompose
    log "Docker upgrade finished"
    ;;
*)
    log "Invalid argument"
    exit 1
    ;;
esac

exit 0
