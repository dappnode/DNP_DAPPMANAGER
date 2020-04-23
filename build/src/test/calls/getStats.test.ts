import "mocha";
import { expect } from "chai";
import rewiremock from "rewiremock";
import getStatsType from "../../src/calls/getStats";
import { CpuInfo } from "os";

const testedCmdResponses: { [cmd: string]: string } = {
  // "grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'":
  //   "46.3738",
  "free / | awk 'NR==2 { print $2}'": "7903472",
  "free / | awk 'NR==3 { print $3}'": "1203200",
  "df / | awk 'NR>1 { print $5}'": "39%"
};

const mockCpuInfo = {
  model: "model",
  speed: 1000000,
  times: {
    user: 1,
    nice: 1,
    sys: 1,
    idle: 1,
    irq: 1
  }
};

describe("Calls > getStats", function() {
  let getStats: typeof getStatsType;

  before("Mock", async () => {
    async function shellMock(cmd: string): Promise<string> {
      if (!testedCmdResponses[cmd]) throw Error(`Unknown cmd: ${cmd}`);
      return testedCmdResponses[cmd];
    }

    const osMock = {
      cpus: (): CpuInfo[] => [mockCpuInfo],
      loadavg: (): number[] => [0.5]
    };

    const mock = await rewiremock.around(
      () => import("../../src/calls/getStats"),
      mock => {
        mock(() => import("../../src/utils/shell"))
          .withDefault(shellMock)
          .toBeUsed();
        mock(() => import("os"))
          .with(osMock)
          .toBeUsed();
      }
    );
    getStats = mock.default;
  });

  it("should return the expected result", async () => {
    const stats = await getStats();
    expect(stats).to.deep.equal({
      cpu: "50%",
      disk: "39%",
      memory: "15%"
    });
  });
});
