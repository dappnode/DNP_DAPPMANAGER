const proxyquire = require("proxyquire");
const sinon = require("sinon");

describe("docker calls", function() {
  const execSpy = sinon.spy();
  const docker = proxyquire("modules/docker/Docker", {
    "./shell": execSpy
  });
  const packageName = "myPackage";
  const imagePath = "./myImage";

  it(".up should call docker/compose with correct arguments", () => {
    docker.compose.up(packageName);
    sinon.assert.calledWith(
      execSpy,
      "docker-compose -f " + packageName + " up -d"
    );
  });

  it(".stop should call docker/compose with correct arguments", () => {
    docker.compose.stop(packageName, { timeout: 0 });
    sinon.assert.calledWith(
      execSpy,
      "docker-compose -f " + packageName + " stop --timeout 0"
    );
  });

  it(".start should call docker/compose with correct arguments", () => {
    docker.compose.start(packageName);
    sinon.assert.calledWith(
      execSpy,
      "docker-compose -f " + packageName + " start"
    );
  });

  it(".down should call docker/compose with correct arguments", () => {
    docker.compose.down(packageName, { timeout: 0 });
    sinon.assert.calledWith(
      execSpy,
      "docker-compose -f " + packageName + " down --timeout 0"
    );
  });

  it(".log should call docker/compose with correct arguments", () => {
    docker.compose.logs(packageName, { timestamps: true });
    sinon.assert.calledWith(
      execSpy,
      "docker-compose -f " + packageName + " logs --timestamps 2>&1"
    );
  });

  it(".loadImage should call REGULAR DOCKER with correct arguments", () => {
    docker.load(imagePath);
    sinon.assert.calledWith(execSpy, "docker load -i " + imagePath);
  });
});
