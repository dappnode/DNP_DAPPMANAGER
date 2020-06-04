import coerceDeviceName from "../../../../pages/devices/helpers/coerceDeviceName";
import { maxIdLength } from "../../../../pages/devices/data";

describe("devices > helpers > coerceDeviceName", () => {
  it("Should remove non-alphanumeric characters", () => {
    const name = "Hello!%&%$   World";
    expect(coerceDeviceName(name)).toEqual("HelloWorld");
  });

  it("Should limit device length", () => {
    const name = "a".repeat(2000);
    expect(coerceDeviceName(name).length).toEqual(maxIdLength);
  });
});
