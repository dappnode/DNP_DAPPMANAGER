import {
  formDataToUserSettings,
  userSettingsToFormData
} from "pages/installer/parsers/formDataParser";
import { SetupWizardFormDataReturn } from "pages/installer/types";
import { UserSettingsAllDnps } from "@dappnode/common";
import deepmerge from "deepmerge";
import { SetupTargetAllDnps } from "types";

const dnpName = "lightning-network.dnp.dappnode.eth";
const depName = "bitcoin.dnp.dappnode.eth";
const service1 = "front";
const service2 = "back";

const testCases: {
  testName: string;
  setupTarget: SetupTargetAllDnps;
  userSettings: UserSettingsAllDnps;
  formData: SetupWizardFormDataReturn;
}[] = [
  {
    testName: "Normal case",
    setupTarget: {
      [dnpName]: {
        payoutAddress: {
          type: "environment",
          name: "PAYOUT_ADDRESS"
        },
        unfilledProp: {
          type: "environment",
          name: "UNFILLED_PROP"
        },
        configFile: {
          type: "fileUpload",
          path: "/usr/src/app/config.json"
        }
      },
      [depName]: {
        uiPort: {
          type: "portMapping",
          containerPort: "8080"
        },
        p2pPort: {
          type: "portMapping",
          containerPort: "5555/udp"
        },
        dataVolume: {
          type: "namedVolumeMountpoint",
          volumeName: "bitcoin_data"
        },
        txIndex: {
          type: "environment",
          name: "BTC_TXINDEX"
        }
      }
    },
    userSettings: {
      [dnpName]: {
        environment: {
          [dnpName]: {
            PAYOUT_ADDRESS: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
          }
        },
        fileUploads: {
          [dnpName]: {
            "/usr/src/app/config.json":
              "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
          }
        }
      },
      [depName]: {
        environment: {
          [depName]: {
            BTC_TXINDEX: "2"
          }
        },
        portMappings: {
          [depName]: {
            "8080": "",
            "5555/udp": "5800"
          }
        },
        namedVolumeMountpoints: {
          bitcoin_data: ""
        }
      }
    },
    formData: {
      [dnpName]: {
        payoutAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        configFile: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
      },
      [depName]: {
        uiPort: "",
        p2pPort: "5800",
        dataVolume: "",
        txIndex: "2"
      }
    }
  },

  {
    testName: "Multi-service case",
    setupTarget: {
      [dnpName]: {
        envService1: {
          type: "environment",
          name: "ENV_SERVICE_1",
          service: service1
        },
        envService2: {
          type: "environment",
          name: "ENV_SERVICE_2",
          service: service2
        }
      }
    },
    userSettings: {
      [dnpName]: {
        environment: {
          [service1]: {
            ENV_SERVICE_1: "value1"
          },
          [service2]: {
            ENV_SERVICE_2: "value2"
          }
        }
      }
    },
    formData: {
      [dnpName]: {
        envService1: "value1",
        envService2: "value2"
      }
    }
  },

  {
    testName: "Multi-service case2",
    setupTarget: {
      [dnpName]: {
        envService1: {
          type: "environment",
          name: "ENV_SERVICE_1",
          service: [service1, service2]
        },
        envService2: {
          type: "environment",
          name: "ENV_SERVICE_2",
          service: service2
        }
      }
    },
    userSettings: {
      [dnpName]: {
        environment: {
          [service1]: {
            ENV_SERVICE_1: "value1"
          },
          [service2]: {
            ENV_SERVICE_1: "value1",
            ENV_SERVICE_2: "value2"
          }
        }
      }
    },
    formData: {
      [dnpName]: {
        envService1: "value1",
        envService2: "value2"
      }
    }
  }
];

describe("setupWizardParsers", () => {
  for (const { testName, setupTarget, userSettings, formData } of testCases) {
    describe(testName, () => {
      it("formDataToUserSettings", () => {
        expect(formDataToUserSettings(formData, setupTarget)).toEqual(
          userSettings
        );
      });

      it("userSettingsToFormData", () => {
        expect(userSettingsToFormData(userSettings, setupTarget)).toEqual(
          formData
        );
      });
    });
  }

  describe("remove unknown props", () => {
    const { userSettings, setupTarget, formData } = testCases[0];

    it("formDataToUserSettings", () => {
      const formDataUnknownProps: SetupWizardFormDataReturn = {
        [dnpName]: {
          ...formData[dnpName],
          unknownProp: "UNKNOWN"
        }
      };

      const formDataWithUnknownProps: SetupWizardFormDataReturn = deepmerge(
        formData,
        formDataUnknownProps
      );

      expect(
        formDataToUserSettings(formDataWithUnknownProps, setupTarget)
      ).toEqual(userSettings);
    });

    it("userSettingsToFormData", () => {
      const unknownDnpName = "unknown.dnp.eth";
      const userSettingsUnknownProps: UserSettingsAllDnps = {
        [unknownDnpName]: {
          environment: {
            [unknownDnpName]: {
              unknownPropFromUnknownDnp: "?"
            }
          }
        },
        [dnpName]: {
          environment: {
            [dnpName]: {
              unknownProp: "UNKNOWN"
            }
          }
        }
      };

      const userSettingsWithUnknownProps: UserSettingsAllDnps = deepmerge(
        userSettings,
        userSettingsUnknownProps
      );

      const formDataResult = userSettingsToFormData(
        userSettingsWithUnknownProps,
        setupTarget
      );

      expect(formDataResult).toEqual(formData);
    });
  });
});
