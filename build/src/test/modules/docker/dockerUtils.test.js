const chai = require("chai");
const expect = require("chai").expect;

chai.should();

const dockerUtils = require("modules/docker/dockerUtils");

describe("docker-compose calls utils", function() {
  describe("parse docker-compose ps output", function() {
    it("should parse a test docker-compose ps output", () => {
      // Output contains extra spaces on purpose
      let dockerPsOutput = `
      Name                        Command                 State             Ports
      ---------------------------------------------------------------------------------------------
      mywordpress_db_1          docker-entrypoint.sh mysqld      Up (healthy)  3306/tcp
      mywordpress_wordpress_1   /entrypoint.sh apache2-for ...   Restarting    0.0.0.0:8000->80/tcp

      `;

      let expectedResult = [
        {
          name: "mywordpress_db_1",
          command: "docker-entrypoint.sh mysqld",
          state: "Up (healthy)",
          ports: "3306/tcp"
        },
        {
          name: "mywordpress_wordpress_1",
          command: "/entrypoint.sh apache2-for ...",
          state: "Restarting",
          ports: "0.0.0.0:8000->80/tcp"
        }
      ];

      let output = dockerUtils.parsePs(dockerPsOutput);
      expect(output).to.deep.equal(expectedResult);
    });

    it("should parse a test docker-compose ps output", () => {
      // Output contains extra spaces on purpose
      let dockerPsOutput = `
      Name                           Command          State   Ports
      -------------------------------------------------------------------------------
      DAppNodePackage-otpweb.dnp.dappnode.eth   nginx -g daemon off;   Up      80/tcp
      `;

      let expectedResult = [
        {
          name: "otpweb.dnp.dappnode.eth",
          command: "nginx -g daemon off;",
          state: "Up",
          ports: "80/tcp"
        }
      ];

      let output = dockerUtils.parsePs(dockerPsOutput);
      expect(output).to.deep.equal(expectedResult);
    });
  });

  describe("parse get container state from docker-compose ps output", function() {
    const PACKAGE_UP_NAME = "myPackageUp";
    const PACKAGE_STOP_NAME = "myPackageStop";
    const PACKAGE_DOWN_NAME = "myPackageDown";

    let dockerPsOutput = `Name                 Command                 State             Ports
    ---------------------------------------------------------------------------------------------
    ${PACKAGE_UP_NAME}          docker-entrypoint.sh mysqld      Up (healthy)  3306/tcp
    ${PACKAGE_STOP_NAME}        /entrypoint.sh apache2-for ...   Exit (137)    0.0.0.0:8000->80/tcp
    `;

    it("should return Up for package Up", () => {
      let state = dockerUtils.containerStateFromPs(
        dockerPsOutput,
        PACKAGE_UP_NAME
      );
      expect(state).to.include("Up");
    });

    it("should return Exit for package stop", () => {
      let state = dockerUtils.containerStateFromPs(
        dockerPsOutput,
        PACKAGE_STOP_NAME
      );
      expect(state).to.include("Exit");
    });

    it("should return Up for package Up", () => {
      let state = dockerUtils.containerStateFromPs(
        dockerPsOutput,
        PACKAGE_DOWN_NAME
      );
      expect(state).to.equal("Down");
    });
  });
});
