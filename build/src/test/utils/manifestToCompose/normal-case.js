/**
 * Normal case for a non-core DNP
 */
const name = "Normal case for a non-core DNP";

const manifest = {
  name: "letsencrypt-nginx.dnp.dappnode.eth",
  version: "0.0.1",
  description: "letsencrypt-nginx-proxy-companion version for DAppNode",
  image: {
    path: "letsencrypt-nginx.dnp.dappnode.eth_0.0.1.tar.xz",
    hash: "Qmbii5osjvJw9CmiRe6huDCb3nabjiyMhA4SNaeubtAAw2",
    size: 23781268,
    volumes: [
      "~/certs:/etc/nginx/certs:rw",
      "/var/run/docker.sock:/var/run/docker.sock:ro"
    ],
    external_vol: [
      "nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d",
      "nginxproxydnpdappnodeeth_html:/usr/share/nginx/html"
    ],
    restart: "always",
    version: "0.0.1"
  },
  author: "Eduardo Antuña Díez (eduadiez)",
  license: "MIT",
  dependencies: {
    "nginx-proxy.dnp.dappnode.eth": "latest"
  },
  origin: "/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34"
};

const dc = `version: '3.4'
services:
    letsencrypt-nginx.dnp.dappnode.eth:
        container_name: DAppNodePackage-letsencrypt-nginx.dnp.dappnode.eth
        image: 'letsencrypt-nginx.dnp.dappnode.eth:0.0.1'
        restart: always
        volumes:
            - '~/certs:/etc/nginx/certs:rw'
            - '/var/run/docker.sock:/var/run/docker.sock:ro'
            - 'nginxproxydnpdappnodeeth_vhost.d:/etc/nginx/vhost.d'
            - 'nginxproxydnpdappnodeeth_html:/usr/share/nginx/html'
        networks:
            - dncore_network
        dns: 172.33.1.2
        labels:
            dappnode.dnp.dependencies: '{"nginx-proxy.dnp.dappnode.eth":"latest"}'
            dappnode.dnp.origin: /ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34
        logging:
            options:
                max-size: 10m
                max-file: '3'
volumes:
    nginxproxydnpdappnodeeth_vhost.d:
        external:
            name: nginxproxydnpdappnodeeth_vhost.d
    nginxproxydnpdappnodeeth_html:
        external:
            name: nginxproxydnpdappnodeeth_html
networks:
    dncore_network:
        external: true
`;

module.exports = { name, manifest, dc };
