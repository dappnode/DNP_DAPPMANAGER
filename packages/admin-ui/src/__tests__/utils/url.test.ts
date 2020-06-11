import { urlJoin } from "utils/url";

describe("api > urls", () => {
  const cases: { args: string[]; result: string }[] = [
    { args: ["/", "rpc"], result: "/rpc" },
    { args: ["http://lh", "rpc"], result: "http://lh/rpc" },
    { args: ["http://lh:3000", "rpc"], result: "http://lh:3000/rpc" },
    { args: ["http://lh/api", "rpc"], result: "http://lh/api/rpc" },
    { args: ["http://lh///api///", "//rpc//"], result: "http://lh/api/rpc/" }
  ];

  for (const { args, result } of cases) {
    it(`Join url parts ${JSON.stringify(args)}`, () => {
      expect(urlJoin(...args)).toEqual(result);
    });
  }
});
