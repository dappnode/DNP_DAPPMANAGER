import "mocha";
import { expect } from "chai";
import assert from "assert";
import fs from "fs";
import retry from "async-retry";
import path from "path";
import shell from "../../../src/utils/shell.js";
import child from "child_process";
import { testDir, cleanTestDir, createTestDir } from "../../testUtils.js";
import {
  listContainer,
  listContainers
} from "../../../src/modules/docker/list.js";
import { dockerContainerInspect } from "../../../src/modules/docker/api.js";
import { ComposeEditor } from "../../../src/modules/compose/editor.js";

/**
 * Dangerous docker-compose behaviour. If starting the container fails,
 * a copy of it will still be around and may cause trouble
 * https://github.com/docker/compose/blob/f13f26d0997edda343913222dcf228000d0a3540/compose/service.py#L588
 */

const dindComposeImage = "danielguerra/dind-compose";

const mainContainerName = "DAppNodeTest-main-service";
const restartContainerName = "DAppNodeTest-restart-service";
const versionPrev = "1.0.0";
const versionNext = "2.0.0";
const labelVersion = "test.dappnode.version";

const testDirContainer = path.resolve("/", testDir);
const volumes = [
  "/var/run/docker.sock:/var/run/docker.sock",
  `${path.resolve(testDir)}:${testDirContainer}`
];
const prevComposeName = `docker-compose-previous.yml`;
const nextComposeName = `docker-compose-next.yml`;
const restartComposeName = `docker-compose-restart.yml`;
const restartEntrypoint = "restart-entrypoint.sh";

const inHost = (_path: string): string => path.join(testDir, _path);
const inContainer = (_path: string): string =>
  path.join(testDirContainer, _path);

/* eslint-disable @typescript-eslint/explicit-function-return-type */

/**
 * Skip until the image 'danielguerra/dind-compose' is publicly available
 * in docker hub or a legitimate mirror
 */
describe.skip("Test a container restarting itself", function () {
  async function cleanContainers(): Promise<void> {
    try {
      await shell(
        `docker rm -f $(docker ps -aq --filter ancestor=${dindComposeImage})`
      );
    } catch (e) {
      // Ignore errors when there are no containers to delete
      if (!e.message.includes("requires at least 1 argument"))
        console.warn(`Error cleaning containers`, e);
    }
  }

  before(`Pull dindComposeImage ${dindComposeImage}`, async () => {
    // Do not stream output. The download progress is really noisy
    console.log(`Pulling image ${dindComposeImage} to test...`);
    await shell(`docker pull ${dindComposeImage}`);
    console.log("Pulled image");
  });

  beforeEach("Prepare test dir", async () => {
    await createTestDir();
  });

  beforeEach(`Clean containers`, async () => {
    await cleanContainers();
  });

  beforeEach(`Write docker-compose`, () => {
    writeCompose({
      name: prevComposeName,
      version: versionPrev,
      container_name: mainContainerName,
      entrypoint: `sleep 100`
    });

    // if [ "$(docker ps -aq -f status=running -f name=${mainContainerName})" ]
    fs.writeFileSync(
      inHost(restartEntrypoint),
      `
docker-compose -f ${inContainer(nextComposeName)} up -d -t 0
UPEXIT=$?
if [ $UPEXIT -ne 0 ]
then
    echo "${mainContainerName} up failed with exit $UPEXIT, starting backup"
    if [ "$(docker ps -aq -f status=running -f name=${mainContainerName})" ]
    then
        echo "${mainContainerName} is still running"
        docker-compose -f ${inContainer(prevComposeName)} up -d -t 0
    else
        echo "${mainContainerName} is not running, using --force-recreate"
        docker-compose -f ${inContainer(
          prevComposeName
        )} up -d -t 0 --force-recreate
    fi
fi
exit $UPEXIT
`
    );

    writeCompose({
      name: restartComposeName,
      version: "0.0.0-restart",
      container_name: restartContainerName,
      entrypoint: `sh ${inContainer(restartEntrypoint)}`
    });
  });

  beforeEach("Start main container", async () => {
    await runUntilExited(
      `docker-compose -f ${inHost(prevComposeName)} up -d`,
      "main"
    );
  });

  function callRestart() {
    const doRestartCmd = `docker-compose -f ${inContainer(
      restartComposeName
    )} up --exit-code-from ${restartContainerName}`;
    return runUntilExited(
      `docker exec ${mainContainerName} /bin/sh -c "${doRestartCmd}"`,
      "call-restart"
    );
  }

  it("Should restart itself", async () => {
    /**
     * Log that should be echo-ed by the next container to confirm it is up
     * and running ok and has been recreated with the next compose
     */
    const nextStartLog = "Hello from next";

    writeCompose({
      name: nextComposeName,
      version: versionNext,
      container_name: mainContainerName,
      entrypoint: `echo '${nextStartLog}' && sleep 100`
    });

    const prev = await listContainer({ containerName: mainContainerName });
    console.log(`Launched prev, ID: ${prev.containerId}`);

    const restartCallExit = await callRestart();
    console.log(
      `EXITED: ${mainContainerName} ${prev.containerId}`,
      restartCallExit
    );
    expect(restartCallExit.error.code).to.equal(
      137,
      "Restart call should exit with 137, killed by docker with SIGKILL"
    );

    // Attach to restart container to see logs and know when it stops
    const restart = await listContainer({
      containerName: restartContainerName
    });
    console.log(
      `Restart container ${restart.state}, ID: ${restart.containerId}`
    );
    const restartExit = await logUntilExited(restart.containerId, "restart");
    console.log(
      `${restartContainerName} ${restart.containerId} exited`,
      restartExit
    );

    // Query the next container that should be running
    const next = await listContainer({ containerName: mainContainerName });
    console.log(`Next container ${next.state} ID: ${next.containerId}`);
    assert.notEqual(
      next.containerId,
      prev.containerId,
      `${mainContainerName} prev and next containers should NOT have the same ID`
    );
    assert.strictEqual(
      next.state,
      "running",
      "Next container should be running"
    );

    // Make sure the next container has been updated
    assert.strictEqual(
      await getVersion(next.containerId),
      versionNext,
      "Final container should have the next version"
    );

    const restartInspect = await dockerContainerInspect(restartContainerName);

    console.log(restartInspect.State);
    const restartFinished = new Date(restartInspect.State.FinishedAt);
    const timeDiff = Date.now() - restartFinished.getTime();
    console.log({ timeDiff });
    // "State": {
    //     "Status": "exited",
    //     "Running": false,
    //     "Paused": false,
    //     "Restarting": false,
    //     "OOMKilled": false,
    //     "Dead": false,
    //     "Pid": 0,
    //     "ExitCode": 0,
    //     "Error": "",
    //     "StartedAt": "2020-05-27T11:14:34.563563403Z",
    //     "FinishedAt": "2020-05-27T11:14:36.168578642Z"
    // }
  });

  it("Should fail starting up a container and up the backup", async () => {
    // Create a container that uses the same mapping as the next container to make it fail
    const portMapping = "38000:38000";
    await shell(`docker run -d -p ${portMapping} ${dindComposeImage}`);

    // This container should fail because its port mapping is already used
    // by the container run above with `docker run -d`
    writeCompose({
      name: nextComposeName,
      version: versionNext,
      container_name: mainContainerName,
      entrypoint: `sleep 100`,
      ports: [portMapping]
    });

    const prev = await listContainer({ containerName: mainContainerName });
    console.log(`Launched prev, ID: ${prev.containerId}`);

    // Attach to prev container to see logs and know when it stops
    // The exit code should be 137 which means killed by docker with SIGKILL (kill -9) `kill -9 (128 + 9 = 137)`
    // https://success.docker.com/article/what-causes-a-container-to-exit-with-code-137
    const restartCallExit = await callRestart();
    console.log(
      `EXITED: ${mainContainerName} ${prev.containerId}`,
      restartCallExit
    );
    expect(restartCallExit.error.code).to.equal(
      137,
      "Restart call should exit with 137, killed by docker with SIGKILL"
    );

    // Attach to restart container to see logs and know when it stops
    const restart = await listContainer({
      containerName: restartContainerName
    });
    console.log(
      `Restart container ${restart.state}, ID: ${restart.containerId}`
    );
    const restartExit = await logUntilExited(restart.containerId, "restart");
    console.log(
      `EXITED ${restartContainerName} ${restart.containerId}`,
      restartExit
    );

    // Query the next container that should be running
    // Because it had failed to be brought up, it will be the temp renamed container
    // cea8fecfa936_DAppNodeTest-main-service
    const [next] = await listContainers();
    console.log(
      `Next container ${next.containerName} ${next.state}, ID: ${next.containerId}`
    );
    assert.strictEqual(
      next.containerName,
      "/" + mainContainerName,
      "Wrong next container name, should not have a hex prefix"
    );
    assert.notStrictEqual(
      next.containerId,
      prev.containerId,
      `${mainContainerName} prev and next containers should have the same ID ${prev.containerId}`
    );
    assert.strictEqual(
      next.state,
      "running",
      "Next container should be running"
    );

    assert.strictEqual(
      await getVersion(next.containerId),
      versionPrev,
      "Final container should have the previous version"
    );

    // "State": {
    //     "Status": "exited",
    //     "Running": false,
    //     "Paused": false,
    //     "Restarting": false,
    //     "OOMKilled": false,
    //     "Dead": false,
    //     "Pid": 0,
    //     "ExitCode": 1,
    //     "Error": "",
    //     "StartedAt": "2020-05-27T11:18:44.099077912Z",
    //     "FinishedAt": "2020-05-27T11:18:46.867974054Z"
    // }
  });

  // In CI the main container is recreated for some reason
  // The goal of this tests is experimentation to design the actual src/ so they are not
  // important until they are refactored to test the actual restartPatch mechanism (if possible)
  it.skip("Should exit on the original process because the next compose is corrupt", async () => {
    // Write a corrupt next compose so it fails before removing the prev container
    fs.writeFileSync(inHost(nextComposeName), "--Corrupted--");

    const prev = await listContainer({ containerName: mainContainerName });
    console.log(`Launched prev, ID: ${prev.containerId}`);

    // Attach to prev container to see logs and know when it stops
    const restartCallExit = await callRestart();
    console.log(
      `EXITED: ${mainContainerName} ${prev.containerId}`,
      restartCallExit
    );

    // The restart call should have failed for a parsing error
    expect(restartCallExit.error.code).to.equal(
      1,
      "Wrong exit code in restart call"
    );
    expect(restartCallExit.stdout).to.include(
      `needs to be an object not '<type 'str'>'`,
      "restart call stdou should include a parsing error message"
    );

    // Attach to restart container to see logs and know when it stops
    const restart = await listContainer({
      containerName: restartContainerName
    });
    console.log(
      `Restart container ${restart.state}, ID: ${restart.containerId}`
    );
    assert.strictEqual(
      restart.state,
      "exited",
      "Restart container should be exited, after failing to start the next container"
    );

    // Query the next container that should be running
    const next = await retry(() =>
      listContainer({ containerName: mainContainerName })
    );
    console.log(`Next container ${next.state}, ID: ${next.containerId}`);
    assert.strictEqual(
      next.containerId,
      prev.containerId,
      `${mainContainerName} prev and next containers should have the same ID ${prev.containerId}`
    );
    assert.strictEqual(
      next.state,
      "running",
      "Next container should be running"
    );

    assert.strictEqual(
      await getVersion(next.containerId),
      versionPrev,
      "Final container should have the previous version"
    );
  });

  afterEach(`Clean containers`, async () => {
    await cleanContainers();
  });

  afterEach(async () => {
    await cleanTestDir();
  });
});

/**
 * Util: to create and write compose
 * @param param0
 */
function writeCompose({
  container_name,
  entrypoint,
  version,
  name,
  ports
}: {
  container_name: string;
  entrypoint: string;
  version: string;
  name: string;
  ports?: string[];
}) {
  const compose = new ComposeEditor({
    version: "3.5",
    services: {
      [container_name]: {
        image: dindComposeImage,
        container_name: container_name,
        volumes,
        entrypoint: `/bin/sh -c "${entrypoint}"`,
        ...(ports ? { ports } : {}),
        labels: {
          [labelVersion]: version
        }
      }
    }
  });
  compose.writeTo(inHost(name));
}

/**
 * Util: Get the version stored in the container label
 * @param id
 */
async function getVersion(id: string) {
  return await shell(
    `docker inspect --format '{{ index .Config.Labels "${labelVersion}"}}' ${id}`
  );
}

interface ProcessResult {
  error: child.ExecException;
  stdout: string;
  stderr: string;
}

/**
 * Pipe a process std to the main process
 * Await for the process to exit
 * @param id
 */
async function runUntilExited(
  cmd: string,
  tag: string
): Promise<ProcessResult> {
  return new Promise(resolve => {
    const proc = child.exec(cmd, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr } as ProcessResult);
    });
    if (proc.stdout) proc.stdout.on("data", logWithTag(tag));
    if (proc.stderr) proc.stderr.on("data", logWithTag(tag));
  });
}

function logWithTag(tag: string) {
  return function (chunk: Buffer) {
    console.log(
      chunk
        .toString()
        .split("\n")
        .map(line => `${tag} | ${line}`)
        .join("\n")
    );
  };
}

/**
 * Pipe a containers logs to the main process
 * Await for the container to exit
 * @param id
 */
async function logUntilExited(id: string, tag: string) {
  const res = await runUntilExited(`docker logs -f ${id}`, tag);
  console.log(`Container ${tag} ${id} exited ${(res.error || {}).code || 0}`);
  return res;
}
