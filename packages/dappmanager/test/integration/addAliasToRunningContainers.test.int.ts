import "mocha";
import { addAliasToRunningContainers } from "../../src/modules/migrations/addAliasToRunningContainers";
import { listContainers } from "../../src/modules/docker/list/index"
import fs from "fs";
import { docker } from "../../src/modules/docker/api/docker";
import { PackageContainer } from "@dappnode/common";
import { migrateCoreNetworkAndAliasInCompose } from "../../src/modules/migrations/addAliasToRunningContainers.js";
import params from "../../src/params.js";
import { mockContainer, mockManifest, shellSafe } from "../testUtils.js";
import { Manifest } from "@dappnode/types";
import { sleep } from "../../src/utils/asyncFlows";


const testAliasPath =
  process.cwd() + "/test/integration/test-alias";

describe("Add alias to running containers", () => {
  // Example package
  const dnpName = "prysm.dnp.dappnode.eth";
  const dnpPrysmPath = process.cwd() + "/dnp_repo/" + dnpName;
  const containerNameMain = "DAppNodeCore-logger-main.dnp.dappnode.eth";
  const containerNameNotMain = "DAppNodeCore-logger-notmain.dnp.dappnode.eth";
  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
  const randomImage = "chentex/random-logger";


  const container: PackageContainer = {
    ...mockContainer,
    containerName: "DAppNodeCore-logger.dnp.dappnode.eth",
    dnpName: "test-alias",
    serviceName: "logger.dnp.dappnode.eth",
  };

  const containerCompose = `
version: '3.4'
services:
  logger-notmain:
    image: "chentex/random-logger"
    container_name: DAppNodeCore-logger-notmain.dnp.dappnode.eth
  logger-main:
    image: "chentex/random-logger"
    container_name: DAppNodeCore-logger-main.dnp.dappnode.eth
    `;


  const manifest: Manifest = {
    ...mockManifest,
    name: "test-alias",
    mainService: "logger-main",
  };

  before("Run expected container", async () => {
    // Create compose
    await shellSafe(`mkdir ${testAliasPath}`);
    // Compose to be migrated
    fs.writeFileSync(
      `${testAliasPath}/docker-compose-logger-main.yml`,
      containerCompose
    );
    fs.writeFileSync(
      `${testAliasPath}/dappnode_package.json`,
      containerCompose
    );
    // Redeclare global variables
    params.DNCORE_DIR = testAliasPath;
    params.REPO_DIR = testAliasPath;
    // Startup container
    await shellSafe(
      `docker-compose -f ${testAliasPath}/docker-compose-logger-main.yml up -d`
    );
    const containerkExists = await shellSafe(
      `docker container ls --filter name=${containerNameMain}`
    );

    const containerkExistsNotMain = await shellSafe(
      `docker container ls --filter name=${containerNameNotMain}`
    );

    const networkExists = await shellSafe(
      `docker network ls --filter name=${dncoreNetwork}`
    );
    
    if (!containerkExists || !containerkExistsNotMain || !networkExists)
      throw Error("Error creating container or/and dncore_network");
  });

  it.only("check that both containers have expected aliases", async () => {
    await shellSafe(
      `docker network connect ${dncoreNetwork} ${containerNameMain}`
    );
    await shellSafe(
      `docker network connect ${dncoreNetwork} ${containerNameNotMain}`
    );
    console.log("connected to network")
    addAliasToRunningContainers();

    console.log("sleeping")

  });

  // after("Remove test setup", async () => {
  //   console.log("removing test setup")
  //   // // Disconnect from network
  //   // await shellSafe(
  //   //   `docker network disconnect ${dncoreNetwork} ${containerNameMain}`
  //   // );
  //   // await shellSafe(
  //   //   `docker network disconnect ${dncoreNetwork} ${containerNameNotMain}`
  //   // );
  //   // // Remove network
  //   // await shellSafe(`docker network rm dncore_network`);

  //   // Remove container
  //   await shellSafe(`docker stop ${containerNameMain}`);
  //   await shellSafe(`docker stop ${containerNameNotMain}`);

  //   // Remove container
  //   await shellSafe(`docker rm ${containerNameMain} --force`);
  //   await shellSafe(`docker rm ${containerNameNotMain} --force`);

  //   // Remove image
  //   await shellSafe(`docker image rm ${randomImage}`);
  //   // Remove dir
  //   await shellSafe(`rm -rf ${testAliasPath}`);

  //   // Return global vars to tests normal values
  //   params.DNCORE_DIR = "./DNCORE";
  //   params.REPO_DIR = "./dnp_repo";
  // });

});

