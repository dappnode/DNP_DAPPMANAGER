/**
 * IPFS case with different port types and multiple volumes
 */
const name = "IPFS case with different port types and multiple volumes";

const manifest = {
  name: "ipfs.dnp.dappnode.eth",
  version: "0.1.0",
  description:
    "Dappnode package responsible for providing IPFS connectivity (go-ipfs v0.4.15)",
  avatar: "/ipfs/QmViXy8BVb8dQ7J9jLK626kcB5Tz2pvvKE43KHo8RNDXxL",
  type: "dncore",
  image: {
    path: "ipfs.dnp.dappnode.eth_0.1.0.tar.xz",
    hash: "/ipfs/QmcVHo2T6qVCZHGPuVJumcDzHyyrGTRHPe3zJ55jitSt7C",
    size: 9131772,
    volumes: ["export:/export", "data:/data/ipfs"],
    ports: ["4001:4001", "4002:4002/udp", "5000"],
    restart: "always",
    subnet: "172.33.0.0/16",
    ipv4_address: "172.33.1.5"
  },
  author: "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
  keywords: ["DAppNodeCore", "IPFS"],
  homepage: "https://github.com/dappnode/DNP_IPFS#readme",
  repository: {
    type: "git",
    url: "https://github.com/dappnode/DNP_IPFS"
  },
  bugs: {
    url: "https://github.com/dappnode/DNP_IPFS/issues"
  },
  license: "GPL-3.0"
};

const dc = `version: '3.4'
services:
    ipfs.dnp.dappnode.eth:
        container_name: DAppNodeCore-ipfs.dnp.dappnode.eth
        image: 'ipfs.dnp.dappnode.eth:0.1.0'
        restart: always
        volumes:
            - 'export:/export'
            - 'data:/data/ipfs'
        ports:
            - '4001:4001'
            - '4002:4002/udp'
            - '5000'
        networks:
            network:
                ipv4_address: 172.33.1.5
        dns: 172.33.1.2
        logging:
            options:
                max-size: 10m
                max-file: '3'
volumes:
    export: {}
    data: {}
networks:
    network:
        driver: bridge
        ipam:
            config:
                -
                    subnet: 172.33.0.0/16
`;

module.exports = { name, manifest, dc };
