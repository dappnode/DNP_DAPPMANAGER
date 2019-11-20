import "mocha";
import { expect } from "chai";

import {
  trimBase64Values,
  hideSensitiveValues,
  limitObjValuesSize
} from "../../src/utils/objects";

describe("Util: objects", () => {
  describe("trimBase64Values", () => {
    it("Should trim a first level base64 string", () => {
      expect(
        trimBase64Values({
          normal: "normal",
          dataurl: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
        })
      ).to.deep.equal({
        normal: "normal",
        dataurl: "data:text/plain"
      });
    });

    it("Should trim a deep key base64 string", () => {
      expect(
        trimBase64Values({
          normal: "normal",
          person: {
            name: "Mike",
            relative: {
              avatar: "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D"
            }
          }
        })
      ).to.deep.equal({
        normal: "normal",
        person: {
          name: "Mike",
          relative: {
            avatar: "data:text/plain"
          }
        }
      });
    });
  });

  describe("hideSensitiveValues", () => {
    it("Should hide a first level private key", () => {
      expect(
        hideSensitiveValues({
          RTL_PASSWORD: "super-password",
          SECRET_PHRASE: "black cheese robin door",
          PRIVATE_KEY: "8986182398162471627461892763891726398124123123213",
          NORMAL: "value"
        })
      ).to.deep.equal({
        RTL_PASSWORD: "**********",
        SECRET_PHRASE: "**********",
        PRIVATE_KEY: "**********",
        NORMAL: "value"
      });
    });

    it("Should hide deep keys that are sensitive", () => {
      expect(
        hideSensitiveValues({
          PRIVATE_WORD: "normal",
          person: {
            name: "Mike",
            relative: {
              NODE_SECRET: "secret",
              color: "blue",
              passwords: {
                FIRST_PASSWORD: "first",
                SECOND_PASSWORD: "second"
              }
            }
          }
        })
      ).to.deep.equal({
        PRIVATE_WORD: "**********",
        person: {
          name: "Mike",
          relative: {
            NODE_SECRET: "**********",
            color: "blue",
            passwords: {
              FIRST_PASSWORD: "**********",
              SECOND_PASSWORD: "**********"
            }
          }
        }
      });
    });
  });

  describe("limitObjValuesSize", () => {
    it("should should limit the size of the string object properties", () => {
      const obj = {
        longProp: "123456789",
        shortProp: "123"
      };
      expect(limitObjValuesSize(obj, 5)).to.deep.equal({
        longProp: "12345",
        shortProp: "123"
      });
    });

    it("should should limit the size of the object object properties, stringifying the long objects", () => {
      const obj = {
        longProp: { a: 123456789 },
        shortProp: { a: 1 }
      };
      expect(limitObjValuesSize(obj, 10)).to.deep.equal({
        longProp: `{"a":12345`,
        shortProp: { a: 1 }
      });
    });
  });
});
