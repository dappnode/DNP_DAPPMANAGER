/**
 * Full VPN case involving "Priviledged" field and env vars
 */
const name = 'Full VPN case involving "Priviledged" field and env vars';

const manifest = {
  name: "vpn.dnp.dappnode.eth",
  version: "0.1.0",
  description:
    "Dappnode package responsible for providing the VPN (L2TP/IPSec) connection",
  avatar: "/ipfs/QmWwMb3XhuCH6JnCF6m6EQzA4mW9pHHtg7rqAfhDr2ofi8",
  type: "dncore",
  image: {
    path: "vpn.dnp.dappnode.eth_0.1.0.tar.xz",
    hash: "/ipfs/QmXvWFs6Re4Bp42gYa4whQE9yKSJbi3g9PETaTUnypQKm5",
    size: 31516488,
    volumes: ["/etc/hostname:/etc/vpnname:ro", "/lib/modules:/lib/modules:ro"],
    ports: ["4500:4500/udp", "500:500/udp"],
    environment: ["VPN_DNS_SRV1=172.33.1.2", "VPN_DNS_SRV2=8.8.8.8"],
    privileged: "true",
    restart: "always",
    subnet: "172.33.0.0/16",
    ipv4_address: "172.33.1.4"
  },
  author: "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
  contributors: [
    "DAppLion <dapplion@giveth.io> (https://github.com/dapplion)",
    "Alex Floyd <alex@giveth.io> (https://github.com/mex20)"
  ],
  keywords: ["DAppNodeCore", "VPN", "IPSec", "L2TP"],
  homepage: "https://github.com/dappnode/DNP_VPN#readme",
  repository: {
    type: "git",
    url: "https://github.com/dappnode/DNP_VPN"
  },
  bugs: {
    url: "https://github.com/dappnode/DNP_VPN/issues"
  },
  license: "GPL-3.0"
};

const dc = `version: '3.4'
services:
    vpn.dnp.dappnode.eth:
        container_name: DAppNodeCore-vpn.dnp.dappnode.eth
        privileged: true
        image: 'vpn.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - '/etc/hostname:/etc/vpnname:ro'
            - '/lib/modules:/lib/modules:ro'
        ports:
            - '4500:4500/udp'
            - '500:500/udp'
        env_file:
            - vpn.dnp.dappnode.eth.env
        networks:
            network:
                ipv4_address: 172.33.1.4
        dns: 172.33.1.2
        logging:
            options:
                max-size: 10m
                max-file: '3'
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`;

module.exports = { name, manifest, dc };
