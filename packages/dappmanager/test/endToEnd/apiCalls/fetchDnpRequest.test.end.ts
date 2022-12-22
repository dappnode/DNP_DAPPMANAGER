import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

const apiCallMethod = "fetchDnpRequest";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should the request of a package id", async () => {
    url.searchParams.set("id", "dappmanager.dnp.dappnode.eth");
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    printData(body);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
    const expectedData = {
      dnpName: "dappmanager.dnp.dappnode.eth",
      semVersion: "0.2.59",
      reqVersion: "0.2.59",
      avatarUrl: "/ipfs/QmfTpBLzoSdrG88ETRnDus27DTDRUrTXyyVmhXDuMNYVaN",
      setupWizard: {},
      imageSize: 64765612,
      isUpdated: false,
      isInstalled: true,
      metadata: {
        name: "dappmanager.dnp.dappnode.eth",
        version: "0.2.59",
        description:
          "Dappnode package responsible for providing the DappNode Package Manager",
        type: "dncore",
        architectures: ["linux/amd64", "linux/arm64"],
        author:
          "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
        contributors: [
          "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
          "DAppLion <dapplion@giveth.io> (https://github.com/dapplion)"
        ],
        keywords: ["DAppNodeCore", "Manager", "Installer"],
        links: {
          ui: "http://my.dappnode/",
          homepage: "https://github.com/dappnode/DNP_DAPPMANAGER#readme"
        },
        repository: {
          type: "git",
          url: "https://github.com/dappnode/DNP_DAPPMANAGER"
        },
        bugs: {
          url: "https://github.com/dappnode/DNP_DAPPMANAGER/issues"
        },
        license: "GPL-3.0"
      },
      specialPermissions: {
        "dappmanager.dnp.dappnode.eth": []
      },
      settings: {
        "dappmanager.dnp.dappnode.eth": {
          environment: {
            "dappmanager.dnp.dappnode.eth": {
              LOG_LEVEL: "info",
              ETH_MAINNET_RPC_URL_OVERRIDE: "",
              ETH_MAINNET_RPC_URL_REMOTE: "",
              IPFS_HOST: "",
              DISABLE_UPNP: "",
              TEST: "true"
            }
          },
          namedVolumeMountpoints: {
            dappmanagerdnpdappnodeeth_data: ""
          }
        }
      },
      compatible: {
        requiresCoreUpdate: false,
        resolving: false,
        isCompatible: true,
        error: "",
        dnps: {
          "dappmanager.dnp.dappnode.eth": {
            from: "0.2.43",
            to: "0.2.59"
          }
        }
      },
      available: {
        isAvailable: true,
        message: ""
      },
      signedSafe: {
        "dappmanager.dnp.dappnode.eth": {
          safe: true,
          message: "Safe origin, bad signature"
        }
      },
      signedSafeAll: true
    };
    expect(body).to.deep.equal(expectedData);
  });
});
