import "mocha";
import { expect } from "chai";
import fs from "fs";
import { getValidator } from "../src/utils/schemaValidation";

describe("route-types sanity check", () => {
  const files = fs.readdirSync("src/route-types");
  for (const fileName of files) {
    const {
      route = "Unknown route",
      requestDataSchema,
      requestDataSample,
      returnDataSchema,
      returnDataSample
    } = require(`../src/route-types/${fileName}`);
    if (requestDataSchema && requestDataSample)
      it(`Request data - ${route}`, () => {
        getValidator(requestDataSchema)(requestDataSample);
        expect(true).to.be.ok;
      });
    if (returnDataSchema && returnDataSample)
      it(`Return data  - ${route}`, () => {
        getValidator(returnDataSchema)(returnDataSample);
        expect(true).to.be.ok;
      });
  }
});
