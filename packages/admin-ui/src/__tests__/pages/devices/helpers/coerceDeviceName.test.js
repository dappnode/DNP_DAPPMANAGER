import coerceDeviceName from "../../../../pages/vpn/helpers/coerceDeviceName";
import { maxIdLength } from "../../../../pages/vpn/data";

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
