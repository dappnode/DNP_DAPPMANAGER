const expect = require("chai").expect;

const limitObjValuesSize = require("utils/limitObjValuesSize");

describe("utils > limitObjValuesSize, utils", () => {
  it("should should limit the size of the string object properties", () => {
    const obj = {
      longProp: "123456789",
      shortProp: "123"
    };
    const maxLen = 5;
    expect(limitObjValuesSize(obj, maxLen)).to.deep.equal({
      longProp: "12345",
      shortProp: "123"
    });
  });

  it("should should limit the size of the object object properties, stringifying the long objects", () => {
    const obj = {
      longProp: { a: 123456789 },
      shortProp: { a: 1 }
    };
    const maxLen = 10;
    expect(limitObjValuesSize(obj, maxLen)).to.deep.equal({
      longProp: `{"a":12345`,
      shortProp: { a: 1 }
    });
  });
});
