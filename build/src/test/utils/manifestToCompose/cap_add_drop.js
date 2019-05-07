/**
 * Special case with "cap_add" and "cap_drop" fields
 */
const name = 'Special case with "cap_add" and "cap_drop" fields';

const manifest = {
  name: "Mysterium",
  version: "",
  description: "",
  avatar: "",
  type: "",
  image: {
    path: "",
    hash: "",
    size: "",
    cap_add: ["SYS_ADMIN"],
    cap_drop: ["NET_ADMIN"],
    network_mode: "host",
    command: "--command"
  }
};

const dc = `version: '3.4'
services:
    Mysterium:
        container_name: DAppNodePackage-Mysterium
        image: 'Mysterium:'
        volumes: []
        networks:
            - dncore_network
        dns: 172.33.1.2
        cap_add:
            - SYS_ADMIN
        cap_drop:
            - NET_ADMIN
        network_mode: host
        command: '--command'
        logging:
            options:
                max-size: 10m
                max-file: '3'
networks:
    dncore_network:
        external: true
`;

module.exports = { name, manifest, dc };
