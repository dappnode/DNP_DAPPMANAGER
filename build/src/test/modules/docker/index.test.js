const docker = require("modules/docker");
const shell = require("utils/shell");
const fs = require("fs");
const params = require("params");
const path = require("path");

const testDir = params.DNCORE_DIR;

const dockerfileData = `FROM nginx:alpine
ADD demoDir /
`;
const dockerfilePath = path.join(testDir, "Dockerfile");
const imageTag = "test-image";

describe.skip("modules > docker", () => {
  const id = "test-container";

  before("Create and up container", async () => {
    // Create mock files
    await shell(`mkdir -p ${path.join(testDir, "demoDir", "test", "demo")}`);
    fs.writeFileSync(
      path.join(testDir, "demoDir", "test", "file.txt"),
      "hwllo-wolrdd from test"
    );
    fs.writeFileSync(
      path.join(testDir, "demoDir", "test", "demo", "file.txt"),
      "hwllo-wolrdd from test/demo"
    );

    // Build and run image
    fs.writeFileSync(dockerfilePath, dockerfileData);
    await shell(`docker build -t "${imageTag}" ${testDir}`);
    await shell(`docker rm -f ${id}`).catch(() => {});
    await shell(`docker run -d --name ${id} ${imageTag}`).catch(e => {
      // If container exists, don't throw
      if (!e.message.includes("already in use")) throw e;
    });
  });

  it("Copy file to a real container", async () => {
    await docker.copyFileTo(id, {
      pathContainer: "/test",
      content: Buffer.from("hello!!"),
      filename: "to.txt"
    });

    await docker.copyFileFromToFs(id, {
      pathContainer: "/test/to.txt",
      pathHost: path.join(testDir, "to.txt.tar")
    });

    await docker.copyFileFromToFs(id, {
      pathContainer: "/test",
      pathHost: path.join(testDir, "test.tar")
    });
  });

  after(async () => {
    // await shell(`docker rm -f ${id}`);
  });
});
