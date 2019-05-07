/**
 * Special case with "cap_add" and "cap_drop" fields
 */
const name = 'Special case with "cap_add" and "cap_drop" fields';

const manifest = {
  name: "custom-chain.dnp.dappnode.eth",
  version: "0.1.0",
  type: "service",
  chain: "ethereum",
  image: {
    path: "",
    hash: "",
    size: ""
  },
  dependencies: {
    "another-chain.dnp.dappnode.eth": "*"
  }
};

const dc = `version: '3.4'
services:
    custom-chain.dnp.dappnode.eth:
        container_name: DAppNodePackage-custom-chain.dnp.dappnode.eth
        image: 'custom-chain.dnp.dappnode.eth:0.1.0'
        volumes: []
        networks:
            - dncore_network
        dns: 172.33.1.2
        labels:
            dappnode.dnp.dependencies: '{"another-chain.dnp.dappnode.eth":"*"}'
            dappnode.dnp.chain: ethereum
        logging:
            options:
                max-size: 10m
                max-file: '3'
networks:
    dncore_network:
        external: true
`;

module.exports = { name, manifest, dc };
