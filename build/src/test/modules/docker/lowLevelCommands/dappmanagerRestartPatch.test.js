const proxyquire = require("proxyquire");
const expect = require("chai").expect;

describe("docker > dappmanagerRestartPatch", () => {
  const imageName = "dappmanager.dnp.dappnode.eth:0.2.0";

  let dc;
  const dappmanagerRestartPatch = proxyquire(
    "modules/docker/lowLevelCommands/dappmanagerRestartPatch",
    {
      fs: {
        writeFileSync: async (path, data) => {
          dc = data;
        }
      },
      "./composeUp": async () => {},
      "./getImage": async () => ({ Id: imageName })
    }
  );

  it("Should generate a the correct docker-compose restart", async () => {
    await dappmanagerRestartPatch();

    const expectedDc = `version: '3.4'
services:
  restart.dnp.dappnode.eth:
    image: dappmanager.dnp.dappnode.eth:0.2.0
      container_name: DAppNodeTool-restart.dnp.dappnode.eth
      volumes:
        - '/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml:/usr/src/app/DNCORE/docker-compose-dappmanager.yml'
        - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
        - '/var/run/docker.sock:/var/run/docker.sock'
      entrypoint:
        docker-compose -f /usr/src/app/DNCORE/docker-compose-dappmanager.yml up -d --force-recreate`;

    expect(dc).to.equal(expectedDc);
  });
});
