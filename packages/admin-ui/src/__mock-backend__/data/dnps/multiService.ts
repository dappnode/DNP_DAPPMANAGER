import { PortProtocol } from "@dappnode/common";
import { MockDnp } from "./types";

const dnpName = "multi-service.dnp.dappnode.eth";
const serviceNames = {
  front: "front",
  back: "back",
  crashed: "crashed",
  restarting: "restarting"
};

export const multiService: MockDnp = {
  avatar: "https://icon-library.com/images/multiple-icon/multiple-icon-15.jpg",

  metadata: {
    name: dnpName,
    version: "0.2.0",
    description: "Sample package with two services.",
    type: "service",
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [],
    links: {
      homepage: "https://github.com/multi-service/multi-service#readme"
    },
    repository: {
      type: "git",
      url: "git+https://github.com/multi-service/multi-service.git"
    },
    bugs: {
      url: "https://github.com/multi-service/multi-service/issues"
    },
    license: "GPL-3.0"
  },

  userSettings: {
    portMappings: {
      [serviceNames.front]: { "8084": "8084" },
      [serviceNames.back]: { "6001": "6001", "6002": "6002" }
    },
    namedVolumeMountpoints: {
      data: ""
    },
    environment: {
      [serviceNames.front]: {
        DUPLICATED_ENV: "value",
        FRONT_ENV: "front"
      },
      [serviceNames.back]: {
        DUPLICATED_ENV: "value",
        BACK_ENV: "back"
      }
    }
  },

  setupWizard: {
    version: "2",
    fields: [
      {
        id: "frontEnv",
        title: "Front env",
        description: "Sample ENV for front service.",
        target: {
          type: "environment",
          name: "FRONT_ENV",
          service: serviceNames.front
        }
      },
      {
        id: "backEnv",
        title: "Back env",
        description: "Sample ENV for back service.",
        target: {
          type: "environment",
          name: "BACK_ENV",
          service: serviceNames.back
        }
      },
      {
        id: "dataVolume",
        title: "Custom volume data path",
        description:
          "If you want to store data is a separate drive, enter the absolute path of the location of an external drive.",
        target: {
          type: "namedVolumeMountpoint",
          volumeName: "data"
        }
      }
    ]
  },

  installedContainers: {
    [serviceNames.front]: {
      state: "running",
      running: true,
      ports: [
        {
          container: 8088,
          host: 8088,
          protocol: PortProtocol.TCP
        }
      ],
      volumes: [
        {
          name: "multiservicednpdappnodeeth_data",
          host: "data",
          container: "./data/ethereum"
        }
      ]
    },
    [serviceNames.back]: {
      state: "exited",
      running: false,
      exitCode: 0,
      ports: [
        {
          container: 6001,
          host: 6001,
          protocol: PortProtocol.TCP
        },
        {
          container: 6002,
          host: 6002,
          protocol: PortProtocol.TCP
        }
      ],
      volumes: [
        {
          name: "multiservicednpdappnodeeth_data",
          host: "data",
          container: "./data/ethereum"
        },
        {
          name: "multiservicednpdappnodeeth_data_backend_1",
          host: "data_backend_1",
          container: "./data/backend1"
        },
        {
          name: "multiservicednpdappnodeeth_data_backend_2",
          host: "data_backend_2",
          container: "./data/backend2"
        }
      ]
    },
    [serviceNames.crashed]: {
      state: "exited",
      running: false,
      exitCode: 127
    },
    [serviceNames.restarting]: {
      state: "restarting",
      running: false,
      exitCode: 0
    }
  }
};
