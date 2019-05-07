const dockerCommands = require("modules/docker/dockerCommands");
const expect = require("chai").expect;

describe("docker commands", function() {
  const packageName = "myPackage";
  const imagePath = "./myImage";

  it(".up should call docker/compose with correct arguments", () => {
    expect(dockerCommands.compose.up(packageName)).to.equal(
      `docker-compose -f myPackage up -d`
    );
  });

  it(".stop should call docker/compose with correct arguments", () => {
    expect(dockerCommands.compose.stop(packageName, { timeout: 0 })).to.equal(
      `docker-compose -f myPackage stop --timeout 0`
    );
  });

  it(".start should call docker/compose with correct arguments", () => {
    expect(dockerCommands.compose.start(packageName)).to.equal(
      `docker-compose -f myPackage start`
    );
  });

  it(".down should call docker/compose with correct arguments", () => {
    expect(dockerCommands.compose.down(packageName, { timeout: 0 })).to.equal(
      `docker-compose -f myPackage down --timeout 0`
    );
  });

  it(".log should call docker/compose with correct arguments", () => {
    expect(
      dockerCommands.compose.logs(packageName, { timestamps: true })
    ).to.equal(`docker-compose -f myPackage logs --timestamps 2>&1`);
  });

  it(".loadImage should call REGULAR DOCKER with correct arguments", () => {
    expect(dockerCommands.load(imagePath)).to.equal(`docker load -i ./myImage`);
  });
});
