/**
 * Deal with empty fields without throwing errors
 */
const name = "Deal with empty fields without throwing errors";

const manifest = {
  name: "EmptyArray",
  version: "",
  description: "",
  avatar: "",
  type: "",
  image: {
    path: "",
    hash: "",
    size: "",
    volumes: [""],
    ports: [""],
    command: "--command"
  }
};

const dc = `version: '3.4'
services:
    EmptyArray:
        container_name: DAppNodePackage-EmptyArray
        image: 'EmptyArray:'
        volumes:
            - ''
        ports:
            - ''
        networks:
            - dncore_network
        dns: 172.33.1.2
        command: '--command'
        logging:
            options:
                max-size: 10m
                max-file: '3'
volumes:
    '': {}
networks:
    dncore_network:
        external: true
`;

module.exports = { name, manifest, dc };
