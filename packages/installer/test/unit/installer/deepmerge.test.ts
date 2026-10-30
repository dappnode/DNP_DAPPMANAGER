import { expect } from "chai";
import { deepmergeCustom } from "deepmerge-ts";

const deepmerge = deepmergeCustom({ filterValues: false });

describe("installer / settings merge", () => {
  it("preserves explicit undefined overrides when clearing settings", () => {
    expect(
      deepmerge({ environment: { service: { VALUE: "old" } } }, { environment: { service: { VALUE: undefined } } })
    ).to.deep.equal({ environment: { service: { VALUE: undefined } } });
  });

  it("preserves nested settings and concatenates arrays without mutating the inputs", () => {
    const previous = { environment: { service: { KEEP: "1", CHANGE: "old" } }, values: [1] };
    const next = { environment: { service: { CHANGE: "new" } }, values: [2] };

    expect(deepmerge(previous, next)).to.deep.equal({
      environment: { service: { KEEP: "1", CHANGE: "new" } },
      values: [1, 2]
    });
    expect(previous.environment.service.CHANGE).to.equal("old");
    expect(previous.values).to.deep.equal([1]);
  });

  it("does not poison the result prototype with untrusted JSON keys", () => {
    const untrusted = JSON.parse('{"__proto__":{"isAdmin":true}}');
    const result = deepmerge({}, untrusted);

    expect(Object.getPrototypeOf(result)).to.equal(Object.prototype);
    expect(result.isAdmin).to.equal(undefined);
    expect(Object.prototype).to.not.have.property("isAdmin");
  });
});
