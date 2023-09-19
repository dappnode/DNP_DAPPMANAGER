import "mocha";
import { addAliasToGivenContainers, addAliasToRunningContainers } from "../../src/modules/migrations/addAliasToRunningContainers";
import { listContainers } from "../../src/modules/docker/list/index"
import fs from "fs";
import { docker } from "../../src/modules/docker/api/docker";
import { PackageContainer } from "@dappnode/common";
import { migrateCoreNetworkAndAliasInCompose } from "../../src/modules/migrations/addAliasToRunningContainers.js";
import params from "../../src/params.js";
import { mockContainer, mockManifest, shellSafe } from "../testUtils.js";
import { Manifest } from "@dappnode/types";
import { sleep } from "../../src/utils/asyncFlows";
import { getPrivateNetworkAlias } from "../../src/domains.js";

  const dnpName = "logger.dnp.dappnode.eth";
  const testAliasPath = process.cwd() + `/test/integration/test-alias/${dnpName}`;
  const testDnpRepoPath = process.cwd() + `/test/integration/test-alias/`;

  const containerNameMain = "DAppNodeTest-logger.main.dnp.dappnode.eth";
  const containerNameNotMain = "DAppNodeTest-logger.notmain.dnp.dappnode.eth";
  const dncoreNetwork = params.DNP_PRIVATE_NETWORK_NAME;
  const loggerImage = "chentex/random-logger";


  const containerMain: PackageContainer = {
    ...mockContainer,
    containerName: "DAppNodeTest-logger.main.dnp.dappnode.eth",
    dnpName: `${dnpName}`,
    serviceName: "main",
    isMain: true,
    isCore: false,
  };

  const containerNotMain: PackageContainer = {
    ...mockContainer,
    containerName: "DAppNodeTest-logger.notmain.dnp.dappnode.eth",
    dnpName: `${dnpName}`,
    serviceName: "notmain",
    isMain: false,
    isCore: false,
  };

  const containers = [containerMain, containerNotMain];

  const containerCompose = `
version: '3.4'
services:
  notmainService:
    image: "chentex/random-logger"
    container_name: DAppNodeTest-logger.notmain.dnp.dappnode.eth
  mainService:
    image: "chentex/random-logger"
    container_name: DAppNodeTest-logger.main.dnp.dappnode.eth
    labels:
      dappnode.dnp.isMain: 'true'
    `;


  const manifest: Manifest = {
    ...mockManifest,
    name: "test-alias",
    mainService: "logger-main",
  };

describe("Add alias to running containers", () => {


  before("Run expected container", async () => {
    // Create compose
    await shellSafe(`mkdir ${testAliasPath}`);
    // Compose to be migrated
    fs.writeFileSync(
      `${testAliasPath}/docker-compose.yml`,
      containerCompose
    );
    fs.writeFileSync(
      `${testAliasPath}/dappnode_package.json`,
      containerCompose
    );
    // Redeclare global variables
    //params.DNCORE_DIR = testAliasPath
    params.REPO_DIR = testDnpRepoPath
    // Startup container
    await shellSafe(
      `docker-compose -f ${testAliasPath}/docker-compose-logger.yml up -d`
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
    
    if (!containerkExists || !containerkExistsNotMain || !networkExists) {
      throw Error("Error creating container or/and dncore_network");
    }
      
      await shellSafe(
        `docker network connect ${dncoreNetwork} ${containerNameMain}`
      );
      await shellSafe(
        `docker network connect ${dncoreNetwork} ${containerNameNotMain}`
      );
      console.log("connected to network")
  });

  it.only("check that both containers have expected aliases", async () => {
    // const aliasMain = getPrivateNetworkAlias(containerMain);
    // const aliasNotMain = getPrivateNetworkAlias(containerNotMain);
    addAliasToGivenContainers(containers);

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

