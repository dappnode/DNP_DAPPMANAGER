/**
 * Normal case for a core DNP
 */
const name = "Normal case for a core DNP";

const manifest = {
  name: "bind.dnp.dappnode.eth",
  version: "0.1.0",
  description: "Dappnode package responsible for providing DNS resolution",
  avatar: "/ipfs/QmXFGDiNDxBVZHLH5MgEstZwHFb2J3CWHmPKmc45zQWv1z",
  type: "dncore",
  image: {
    path: "bind.dnp.dappnode.eth_0.1.0.tar.xz",
    hash: "/ipfs/QmTz1c5RWT7qyKBhnv4tUbPcMarpTSsDd8r6GXG6LD176j",
    size: 3235875,
    volumes: ["dnp_bind_data:/etc/bind"],
    restart: "always",
    subnet: "172.33.0.0/16",
    ipv4_address: "172.33.1.2"
  }
};

const dc = `version: '3.4'
services:
    bind.dnp.dappnode.eth:
        container_name: DAppNodeCore-bind.dnp.dappnode.eth
        image: 'bind.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - 'dnp_bind_data:/etc/bind'
        networks:
            network:
                ipv4_address: 172.33.1.2
        dns: 172.33.1.2
        logging:
            options:
                max-size: 10m
                max-file: '3'
volumes:
    dnp_bind_data: {}
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`;

module.exports = { name, manifest, dc };
