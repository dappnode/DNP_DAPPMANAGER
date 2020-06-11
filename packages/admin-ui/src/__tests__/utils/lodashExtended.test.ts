import { UserSettingsAllDnps } from "types";
import deepmerge from "deepmerge";
import { difference, isDeepEmpty } from "utils/lodashExtended";

describe("lodashExtended", () => {
  describe("difference", () => {
    const dnpName = "lightning-network.dnp.dappnode.eth";
    const depName = "bitcoin.dnp.dappnode.eth";

    const userSettings: UserSettingsAllDnps = {
      [dnpName]: {
        environment: {
          PAYOUT_ADDRESS: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
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

    const additionalUserSettings: UserSettingsAllDnps = {
      [dnpName]: {
        fileUploads: {
          "/usr/src/app/config.json":
            "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
        }
      },
      [depName]: {
        portMappings: {
          "5555/udp": ""
        },
        namedVolumeMountpoints: {
          bitcoin_data: "/dev1/custom-path/"
        }
      }
    };

    it("Should return the difference of an object with new keys", () => {
      const newUserSettings = deepmerge(userSettings, additionalUserSettings);
      expect(difference(userSettings, newUserSettings)).toEqual(
        additionalUserSettings
      );
    });
  });

  describe("isDeepEmpty", () => {
    const jsons: { json: any; empty: boolean; id: string }[] = [
      // First level
      { id: "Empty object", json: {}, empty: true },
      { id: "Empty array", json: [], empty: true },
      { id: "Object with props", json: { a: 1 }, empty: false },
      { id: "Array with props", json: [1, 2], empty: false },
      // Second level
      { id: "Object of empty object", json: { a: {}, b: {} }, empty: true },
      { id: "Object with subprops", json: { a: { aa: 1 } }, empty: false },
      // Thrid level
      {
        id: "Thrid level empty Object",
        json: { a: { aa: {} }, b: { bb: {} }, c: {} },
        empty: true
      },
      {
        id: "Thrid level non empty Object",
        json: { a: { aa: { aaa: 1 } }, b: { bb: {} } },
        empty: false
      }
    ];
    for (const { json, empty, id } of jsons) {
      it(`${id} should be ${empty ? "empty" : "not empty"}`, () => {
        expect(isDeepEmpty(json)).toEqual(empty);
      });
    }
  });
});
