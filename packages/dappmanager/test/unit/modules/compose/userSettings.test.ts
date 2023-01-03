import "mocha";
import { expect } from "chai";
import { pick } from "lodash-es";
import { Compose, ComposeService } from "@dappnode/dappnodesdk";
import { UserSettings } from "@dappnode/common";

import {
  parseUserSettings,
  applyUserSettings
} from "../../../../src/modules/compose";

const bitcoinVolumeName = "bitcoin_data";
const bitcoinVolumeNameNew = "bitcoin_new_data";

const mockDnpName = "mock-dnp.dnp.dappnode.eth";
const mockDnpVersion = "0.0.0";
const mockComposeService: ComposeService = {
  image: `${mockDnpName}:${mockDnpVersion}`,
  container_name: `DAppNodePackage-${mockDnpName}`
};

const mockCompose: Compose = {
  version: "3.5",
  services: {
    [mockDnpName]: mockComposeService
  }
};

const polkadotServiceName = "polkadot-kusama.public.dappnode.eth";
const polkadotNewCompose = {
  version: "3.5",
  services: {
    [polkadotServiceName]: {
      image: "polkadot-kusama.public.dappnode.eth:0.0.2",
      volumes: ["polkadot:/polkadot"],
      ports: ["30333:30333"],
      environment: {
        NODE_NAME: "DAppNodeNodler",
        VALIDATOR_ENABLE: "no",
        TELEMETRY_ENABLE: "no",
        EXTRA_OPTS: "--out-peers 10 --in-peers 10"
      },
      restart: "unless-stopped",
      container_name: "DAppNodePackage-polkadot-kusama.public.dappnode.eth",
      dns: "172.33.1.2",
      networks: ["dncore_network"]
    }
  },
  volumes: {
    polkadot: {}
  },
  networks: {
    dncore_network: {
      external: true
    }
  }
};

const polkadotCurrentCompose = {
  ...polkadotNewCompose,
  services: {
    [polkadotServiceName]: {
      ...polkadotNewCompose.services[polkadotServiceName]
    }
  }
};

describe("parseUserSet", () => {
  it("Should parse a normal case", () => {
    const compose: Compose = {
      ...mockCompose,
      services: {
        [mockDnpName]: {
          ...mockComposeService,
          environment: {
            ORIGINAL: "0",
            USERSET: "1"
          },
          ports: ["4001:4001", "9090:9090", "32764:6000"],
          volumes: [
            "/dev1/custom-path:/usr/data0",
            "moredata:/usr/data1",
            `${bitcoinVolumeNameNew}:/usr/data2`
          ]
        }
      },
      volumes: {
        moredata: {},
        [bitcoinVolumeName]: {},
        [bitcoinVolumeNameNew]: {
          driver_opts: {
            device: `/dev0/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/${bitcoinVolumeNameNew}`,
            o: "bind",
            type: "none"
          }
        }
      }
    };

    const userSettings = parseUserSettings(compose);

    const expectedUserSet: UserSettings = {
      environment: {
        [mockDnpName]: {
          ORIGINAL: "0",
          USERSET: "1"
        }
      },
      portMappings: {
        [mockDnpName]: {
          "4001/TCP": "4001",
          "6000/TCP": "32764",
          "9090/TCP": "9090"
        }
      },
      namedVolumeMountpoints: {
        [bitcoinVolumeNameNew]: "/dev0/data",
        moredata: ""
      }
    };

    expect(userSettings).to.deep.equal(expectedUserSet);
  });

  it("Should parse a legacy bitcoin DNP without default.volumes", () => {
    const bitcoinName = "bitcoin.dnp.dappnode.eth";

    const compose: Compose = {
      ...mockCompose,
      services: {
        [bitcoinName]: {
          ...mockComposeService,
          volumes: ["/dev1/custom-path:/root/.bitcoin", "moredata:/usr/data2"]
        }
      },
      volumes: {
        [bitcoinVolumeName]: {},
        moredata: {}
      }
    };

    const userSettings = parseUserSettings(compose);

    const expectedUserSet: UserSettings = {
      namedVolumeMountpoints: {
        moredata: ""
      },
      legacyBindVolumes: {
        [bitcoinName]: {
          [bitcoinVolumeName]: "/dev1/custom-path"
        }
      }
    };

    expect(userSettings).to.deep.equal(expectedUserSet);
  });

  it("Should parse correctly for an update with a named volume (bug)", () => {
    const userSettings = parseUserSettings(polkadotCurrentCompose);

    const expectedUserSet: UserSettings = {
      environment: {
        [polkadotServiceName]: {
          EXTRA_OPTS: "--out-peers 10 --in-peers 10",
          NODE_NAME: "DAppNodeNodler",
          TELEMETRY_ENABLE: "no",
          VALIDATOR_ENABLE: "no"
        }
      },
      portMappings: {
        [polkadotServiceName]: {
          "30333/TCP": "30333"
        }
      },
      namedVolumeMountpoints: {
        polkadot: ""
      }
    };

    expect(userSettings).to.deep.equal(expectedUserSet);
  });

  it("Should parse a DNP_ETHCHAIN compose userSettings", () => {
    const serviceName = "ethchain.dnp.dappnode.eth";
    const compose: Compose = {
      version: "3.5",
      networks: {
        network: {
          driver: "bridge",
          ipam: { config: [{ subnet: "172.33.0.0/16" }] }
        }
      },
      volumes: {
        ethchaindnpdappnodeeth_data: {},
        ethchaindnpdappnodeeth_geth: {},
        ethchaindnpdappnodeeth_identity: {},
        ethchaindnpdappnodeeth_ipc: {}
      },
      services: {
        [serviceName]: {
          image: "ethchain.dnp.dappnode.eth:0.2.20",
          container_name: "DAppNodeCore-ethchain.dnp.dappnode.eth",
          restart: "unless-stopped",
          volumes: [
            "ethchaindnpdappnodeeth_data:/root/.local/share/io.parity.ethereum",
            "ethchaindnpdappnodeeth_geth:/root/.ethereum",
            "ethchaindnpdappnodeeth_identity:/root/identity",
            "ethchaindnpdappnodeeth_ipc:/root/.ethereum/ipc"
          ],
          environment: {
            EXTRA_OPTS: "--warp-barrier 9530000",
            EXTRA_OPTS_GETH: "",
            DEFAULT_CLIENT: "PARITY"
          },
          ports: ["35353:30303", "35353:30303/udp", "35354:30304/udp"],
          dns: "172.33.1.2",
          networks: {
            network: {
              ipv4_address: "172.33.1.6"
            }
          }
        }
      }
    };

    const expectedUserSet: UserSettings = {
      environment: {
        [serviceName]: {
          EXTRA_OPTS: "--warp-barrier 9530000",
          EXTRA_OPTS_GETH: "",
          DEFAULT_CLIENT: "PARITY"
        }
      },
      portMappings: {
        [serviceName]: {
          "30303/TCP": "35353",
          "30303/UDP": "35353",
          "30304/UDP": "35354"
        }
      },
      namedVolumeMountpoints: {
        ethchaindnpdappnodeeth_data: "",
        ethchaindnpdappnodeeth_geth: "",
        ethchaindnpdappnodeeth_identity: "",
        ethchaindnpdappnodeeth_ipc: ""
      }
    };

    const userSettings = parseUserSettings(compose);
    expect(userSettings).to.deep.equal(expectedUserSet);
  });
});

describe("applyUserSettings", () => {
  /**
   * Same function as applyUserSettings but without adding labels
   * To avoid having to add the labels to the test result data
   */
  const applyUserSettingsTest: typeof applyUserSettings = (...args) => {
    const nextCompose = applyUserSettings(...args);
    for (const serviceName in nextCompose.services)
      delete nextCompose.services[serviceName].labels;
    return nextCompose;
  };

  it("Should apply some user settings", () => {
    const bitcoinVolumeName = "bitcoin_data";
    const bitcoinVolumeNameNew = "bitcoin_new_data";

    const compose: Compose = {
      ...mockCompose,
      services: {
        [mockDnpName]: {
          ...mockComposeService,
          environment: { ORIGINAL: "VALUE", USERSET: "VALUE" },
          ports: ["4001:4001", "9090:9090/udp", "32764:6000"],
          volumes: [
            `${bitcoinVolumeNameNew}:/usr/data0`,
            "/dev1/custom-path:/usr/data1",
            `${bitcoinVolumeName}:/usr/data2`
          ]
        }
      },
      volumes: {
        [bitcoinVolumeNameNew]: {},
        [bitcoinVolumeName]: {}
      }
    };

    const userSet: UserSettings = {
      environment: {
        [mockDnpName]: {
          USERSET: "NEW_VALUE"
        }
      },
      portMappings: {
        [mockDnpName]: {
          "4001/TCP": "4111",
          "9090/UDP": ""
        }
      },
      namedVolumeMountpoints: {
        [bitcoinVolumeNameNew]: "/dev0/data"
      },
      legacyBindVolumes: {
        [mockDnpName]: {
          [bitcoinVolumeName]: "/dev2/user-set-path"
        }
      }
    };

    const composeReturn = applyUserSettingsTest(compose, userSet, {
      dnpName: mockDnpName
    });
    const expectedCompose: Compose = {
      ...compose,
      services: {
        [mockDnpName]: {
          ...mockComposeService,
          environment: { ORIGINAL: "VALUE", USERSET: "NEW_VALUE" },
          ports: ["4111:4001", "9090/udp", "32764:6000"],
          volumes: [
            `${bitcoinVolumeNameNew}:/usr/data0`,
            "/dev1/custom-path:/usr/data1",
            "/dev2/user-set-path:/usr/data2"
          ]
        }
      },
      volumes: {
        ...compose.volumes,
        [bitcoinVolumeNameNew]: {
          driver_opts: {
            device: `/dev0/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/${bitcoinVolumeNameNew}`,
            o: "bind",
            type: "none"
          }
        }
      }
    };
    expect(composeReturn).to.deep.equal(expectedCompose);
  });

  it("Should apply a setting to make a host port ephemeral", () => {
    const compose: Compose = {
      ...mockCompose,
      services: {
        [mockDnpName]: {
          ...mockComposeService,
          ports: ["3333/udp", "4444:4444/udp"]
        }
      }
    };

    const userSet: UserSettings = {
      portMappings: {
        [mockDnpName]: { "3333/UDP": "3330", "4444/UDP": "" }
      }
    };

    const expectedServiceParts = {
      ports: ["3330:3333/udp", "4444/udp"]
    };
    const composeReturn = applyUserSettingsTest(compose, userSet, {
      dnpName: mockDnpName
    });
    const serviceParts = pick(composeReturn.services[mockDnpName], ["ports"]);

    expect(serviceParts).to.deep.equal(expectedServiceParts);
  });

  it("Should return the same compose if re-applying it's own user settings", () => {
    const userSettings = parseUserSettings(polkadotCurrentCompose);
    const composeReturn = applyUserSettingsTest(
      polkadotNewCompose,
      userSettings,
      { dnpName: mockDnpName }
    );
    expect(composeReturn).to.deep.equal(polkadotCurrentCompose);
  });

  it("Should apply allNamedVolumeMountpoint setting, and persist an update", () => {
    const mountpoint = "/dev1/data";

    const originalCompose: Compose = {
      ...mockCompose,
      services: {
        [mockDnpName]: {
          ...mockComposeService,
          volumes: ["data:/usr/data", "identity:/usr/id"]
        }
      },
      volumes: {
        data: {},
        identity: {}
      }
    };

    const userSet: UserSettings = {
      allNamedVolumeMountpoint: mountpoint
    };

    const expectedComposeAfterFirstInstall: Compose = {
      ...originalCompose,
      services: {
        [mockDnpName]: {
          ...originalCompose.services[mockDnpName],
          volumes: ["data:/usr/data", "identity:/usr/id"]
        }
      },
      volumes: {
        data: {
          driver_opts: {
            device:
              "/dev1/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/data",
            o: "bind",
            type: "none"
          }
        },
        identity: {
          driver_opts: {
            device:
              "/dev1/data/dappnode-volumes/mock-dnp.dnp.dappnode.eth/identity",
            o: "bind",
            type: "none"
          }
        }
      }
    };

    const expectedUserSettingsOnUpdate: UserSettings = {
      namedVolumeMountpoints: {
        data: mountpoint,
        identity: mountpoint
      }
    };

    expect(
      applyUserSettingsTest(originalCompose, userSet, { dnpName: mockDnpName })
    ).to.deep.equal(
      expectedComposeAfterFirstInstall,
      "allNamedVolumeMountpoint setting should be applied in first install"
    );

    const userSettingsOnUpdate = parseUserSettings(
      expectedComposeAfterFirstInstall
    );
    expect(userSettingsOnUpdate).to.deep.equal(expectedUserSettingsOnUpdate);
    expect(
      applyUserSettingsTest(originalCompose, userSettingsOnUpdate, {
        dnpName: mockDnpName
      })
    ).to.deep.equal(
      expectedComposeAfterFirstInstall,
      "After a future update the user settings from allNamedVolumeMountpoint should persist"
    );
  });

  it("Should respect a legacy bitcoin.dnp.dappnode.eth legacy volume bind setting in an update", () => {
    const dnpName = "bitcoin.dnp.dappnode.eth";
    const customBind = "/local/custom/bind";

    const oldLocalCompose: Compose = {
      version: "3.5",
      services: {
        [dnpName]: {
          container_name: dnpName,
          image: `${dnpName}:0.1.0`,
          volumes: [`${customBind}:/root/.bitcoin`]
        }
      },
      volumes: {
        bitcoin_data: {}
      }
    };

    const newCompose: Compose = {
      version: "3.5",
      services: {
        [dnpName]: {
          container_name: dnpName,
          image: `${dnpName}:0.2.0`,
          volumes: ["bitcoin_data:/root/.bitcoin"]
        }
      },
      volumes: {
        bitcoin_data: {}
      }
    };

    const expectedComposeAfterUpdate: Compose = {
      ...newCompose,
      services: {
        [dnpName]: {
          ...newCompose.services[dnpName],
          volumes: [`${customBind}:/root/.bitcoin`]
        }
      }
    };

    const expectedUserSettingsOnUpdate: UserSettings = {
      legacyBindVolumes: {
        [dnpName]: {
          bitcoin_data: customBind
        }
      }
    };

    const userSettingsOnUpdate = parseUserSettings(oldLocalCompose);
    expect(userSettingsOnUpdate).to.deep.equal(
      expectedUserSettingsOnUpdate,
      "Wrong userSettingsOnUpdate"
    );
    expect(
      applyUserSettingsTest(newCompose, userSettingsOnUpdate, { dnpName })
    ).to.deep.equal(expectedComposeAfterUpdate, "Wrong composeAfterUpdate");
  });
});
