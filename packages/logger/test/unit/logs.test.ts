import "mocha";
import { expect } from "chai";
import { maxLength } from "../../src/params.js";
import { logSafeObjects } from "../../src/logSafeObjects.js";

describe("Util: logs", () => {
  it("Should trim a first level base64 string", () => {
    expect(
      logSafeObjects({
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
      logSafeObjects({
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

  it("Should hide a first level private key", () => {
    expect(
      logSafeObjects({
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
      logSafeObjects({
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

  it("should should limit the size of the string object properties", () => {
    const obj = {
      longProp: "1".repeat(2 * maxLength),
      shortProp: "1"
    };
    expect(logSafeObjects(obj)).to.deep.equal({
      longProp: "1".repeat(maxLength),
      shortProp: "1"
    });
  });

  it("should keep an array of objects as an array", () => {
    const obj = {
      a: 1,
      PRIVATE_WORD: "normal"
    };
    expect(logSafeObjects([obj])).to.deep.equal([
      {
        a: 1,
        PRIVATE_WORD: "**********"
      }
    ]);
  });
});
