import "mocha";
import fs from "fs";
import Logs from "../src/logs";
const logs = Logs(module);

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

    // Assert that the sample (tied to typescript definitions)
    // Matches the provided schema. If not, it will throw

    if (requestDataSchema && requestDataSample)
      it(`Request data - ${route}`, () => {
        const validateRequest = getValidator(
          requestDataSchema,
          "request",
          logs.error
        );
        validateRequest(requestDataSample);
      });
    if (returnDataSchema && returnDataSample)
      it(`Return data  - ${route}`, () => {
        const validateReturn = getValidator(
          returnDataSchema,
          "return",
          logs.error
        );
        validateReturn(returnDataSample);
      });
  }
});
