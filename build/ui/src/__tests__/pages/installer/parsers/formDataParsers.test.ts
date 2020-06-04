import {
  formDataToUserSettings,
  userSettingsToFormData
} from "pages/installer/parsers/formDataParser";
import { SetupWizardFormDataReturn } from "pages/installer/types";
import { UserSettingsAllDnps, SetupTargetAllDnps } from "types";
import deepmerge from "deepmerge";

describe("formDataToUserSettings", () => {
  const dnpName = "lightning-network.dnp.dappnode.eth";
  const depName = "bitcoin.dnp.dappnode.eth";

  // const setupSchema: SetupSchemaAllDnps = {
  //   [dnpName]: {
  //     type: "object",
  //     properties: {
  //       payoutAddress: { type: "string", title: "Payout address" },
  //       unfilledProp: { type: "string", title: "Payout address" },
  //       configFile: { type: "string", format: "data-url", title: "Config file" }
  //     }
  //   },
  //   [depName]: {
  //     type: "object",
  //     properties: {
  //       uiPort: { type: "string", title: "UI port" },
  //       p2pPort: { type: "string", title: "P2P port" },
  //       dataVolume: { type: "string", title: "Custom volume path" },
  //       txIndex: {
  //         type: "string",
  //         title: "TX index",
  //         description: "Choose the TX index",
  //         default: "1",
  //         enum: ["0", "1", "2"]
  //       }
  //     }
  //   }
  // };

  const setupTarget: SetupTargetAllDnps = {
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
  };

  const userSettings: UserSettingsAllDnps = {
    [dnpName]: {
      environment: {
        PAYOUT_ADDRESS: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
      },
      fileUploads: {
        "/usr/src/app/config.json":
          "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
      }
    },
    [depName]: {
      portMappings: {
        "8080": "",
        "5555/udp": "5800"
      },
      namedVolumeMountpoints: {
        bitcoin_data: ""
      },
      environment: {
        BTC_TXINDEX: "2"
      }
    }
  };

  const formData: SetupWizardFormDataReturn = {
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
  };

  it("Should convert form data to userSettings", () => {
    expect(formDataToUserSettings(formData, setupTarget)).toEqual(userSettings);
  });

  it("Should convert form data to userSettings with unknown props", () => {
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

  it("Should convert userSettings to form data", () => {
    expect(userSettingsToFormData(userSettings, setupTarget)).toEqual(formData);
  });

  it("Should convert userSettings to form data with unknown props", () => {
    const userSettingsUnknownProps: UserSettingsAllDnps = {
      "unknown.dnp.eth": {
        environment: {
          unknownPropFromUnknownDnp: "?"
        }
      },
      [dnpName]: {
        environment: {
          unknownProp: "UNKNOWN"
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
