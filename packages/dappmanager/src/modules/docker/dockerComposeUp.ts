import fs from "fs";
import params from "../../params";
import * as getPath from "../../utils/getPath";
import { restartDappmanagerPatch } from "../installer/restartPatch";
import { ComposeFileEditor } from "../compose/editor";
import {
  dockerComposeDown,
  dockerComposeUp,
  DockerComposeUpOptions
} from "./compose";
import { listPackageNoThrow } from "./list";
import { getDockerTimeoutMax } from "./utils";
import { logs } from "../../logs";
import {
  ContainersStatus,
  InstalledPackageData,
  PackageContainer
} from "@dappnode/common";

interface ComposeUpArgs {
  dnpName: string;
  composePath?: string;
}

/**
 * docker-compose up but it also
 * - Uses a custom timeout defined by the package developer
 * - Prevents starting stoped containers if any
 */
export async function dockerComposeUpPackage(
  { dnpName, composePath }: ComposeUpArgs,
  containersStatus: ContainersStatus,
  dockerComposeUpOptions: DockerComposeUpOptions = {},
  upAll = false
): Promise<void> {
  if (!composePath) composePath = getPath.dockerComposeSmart(dnpName);
  if (!fs.existsSync(composePath)) {
    throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
  }

  // DAPPMANAGER patch
  if (dnpName === params.dappmanagerDnpName) {
    // Note: About restartPatch, combining rm && up doesn't prevent the installer from crashing
    await restartDappmanagerPatch({ composePath });
    return;
  }

  // Add timeout option if not previously specified
  const timeout = getDockerTimeoutMax(Object.values(containersStatus));
  if (timeout && !dockerComposeUpOptions.timeout)
    dockerComposeUpOptions.timeout = timeout;

  // Check the current status of package's container if any
  const serviceNames: string[] = readComposeServiceNames(composePath);
  const servicesToStart = serviceNames.filter(
    serviceName => containersStatus[serviceName]?.targetStatus !== "stopped"
  );

  try {
    if (
      upAll ||
      serviceNames.length === servicesToStart.length ||
      dnpName === params.coreDnpName
    ) {
      // Run docker-compose up on all services for:
      // - packages with all services running
      // - core package, it must be executed always. No matter the previous status
      await dockerComposeUp(composePath, dockerComposeUpOptions);
    } else {
      // If some services are not running, first create the containers
      // then start only those that are running
      await dockerComposeUp(composePath, {
        ...dockerComposeUpOptions,
        noStart: true
      });
      if (servicesToStart.length > 0) {
        await dockerComposeUp(composePath, {
          ...dockerComposeUpOptions,
          serviceNames: servicesToStart
        });
      }
    }
  } catch (e) {
    if (
      e.message.includes(
        "Renaming a container with the same name as its current name"
      )
    ) {
      // Catch error: Error response from daemon: Renaming a container with the same name as its current name
      // Ref: https://github.com/docker/compose/issues/6704
      logs.info("Catch error renaming container with the same name");
      // Do compose down and compose up
      await dockerComposeDown(composePath);
      await dockerComposeUp(composePath, dockerComposeUpOptions);
    } else {
      throw e;
    }
  }
}

function readComposeServiceNames(composePath: string): string[] {
  const compose = ComposeFileEditor.readFrom(composePath);
  return Object.keys(compose.services);
}

/**
 * Gather non-essential data for docker-compose up
 * - Check if any container is properly stopped, exited + exitCode === 0
 * - Get its docker timeout
 */
export async function getContainersStatus({
  dnpName,
  dnp
}: {
  dnpName: string;
  dnp?: InstalledPackageData | null;
}): Promise<ContainersStatus> {
  if (!dnp) {
    dnp = await listPackageNoThrow({ dnpName });
  }

  if (!dnp) {
    return {};
  }

  const containersStatus: ContainersStatus = {};

  await Promise.all(
    dnp.containers.map(async container => {
      containersStatus[container.serviceName] = {
        targetStatus: await getContainerTargetStatus(container),
        dockerTimeout: container.dockerTimeout
      };
    })
  );

  return containersStatus;
}

/**
 * Given a container current state determine if it should be running or not
 * It is allowed to stop ONLY if
 * - Properly stopped: status === exited && exitCode === 0
 * - Not started: status === created
 * @param container
 */
async function getContainerTargetStatus(
  container: PackageContainer
): Promise<"stopped" | "running"> {
  if (params.corePackagesThatMustBeRunning.includes(container.dnpName)) {
    return "running";
  }

  switch (container.state) {
    case "removing":
    // Status exited means that the container has receive a signal to stop or kill the process. Deppending on
    // how the docker container handles the signal it will exit with code 0 or != 0. So it cannot be
    // determined if the container was manually and gracefully stopped or not.
    case "exited":
    // When packages are gracefully stopped they might be recreated again by this code
    // and stay in created status, because they won't be stopped. So we must consider
    // a created state as stopped to preserve the user's preference
    case "created":
      return "stopped";

    case "dead":
    case "paused":
    case "restarting":
    case "running":
      return "running";
  }
}
