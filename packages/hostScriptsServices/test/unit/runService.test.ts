import "mocha";
import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { params } from "@dappnode/params";
import { getCandidateServicePaths, resolveServicePath } from "../../src/hostServices/runService.js";

describe("hostServices > runService", () => {
  describe("params.HOST_SERVICES_SOURCE_DIR", () => {
    it("should be an absolute path", () => {
      expect(path.isAbsolute(params.HOST_SERVICES_SOURCE_DIR)).to.be.true;
    });

    it("should point to the expected container directory", () => {
      expect(params.HOST_SERVICES_SOURCE_DIR).to.equal("/usr/src/app/hostServices");
    });
  });

  describe("getCandidateServicePaths", () => {
    it("should return an array with the primary path first", () => {
      const paths = getCandidateServicePaths("docker-upgrade.service");
      expect(paths).to.be.an("array").with.length.greaterThan(0);
      expect(paths[0]).to.equal(
        path.join(params.HOST_SERVICES_SOURCE_DIR, "docker-upgrade.service")
      );
    });

    it("should include the DNCORE bind-volume fallback path", () => {
      const paths = getCandidateServicePaths("docker-upgrade.service");
      expect(paths).to.include("/usr/src/app/DNCORE/services/host/docker-upgrade.service");
    });

    it("should include the build-stage fallback path", () => {
      const paths = getCandidateServicePaths("docker-upgrade.service");
      expect(paths).to.include(
        "/app/packages/hostScriptsServices/hostServices/docker-upgrade.service"
      );
    });
  });

  describe("resolveServicePath", () => {
    it("should return undefined when no candidate paths exist", () => {
      const result = resolveServicePath("nonexistent-service.service", [
        "/tmp/definitely-does-not-exist/nonexistent-service.service",
        "/tmp/also-does-not-exist/nonexistent-service.service"
      ]);
      expect(result).to.be.undefined;
    });

    it("should return the first existing path among candidates", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dappnode-test-services-"));
      const serviceFile = path.join(tmpDir, "docker-upgrade.service");
      try {
        fs.writeFileSync(serviceFile, "[Unit]\nDescription=Test service\n");
        const candidates = [
          "/tmp/does-not-exist/docker-upgrade.service",
          serviceFile
        ];
        const result = resolveServicePath("docker-upgrade.service", candidates);
        expect(result).to.equal(serviceFile);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("should prefer an earlier candidate path over a later one", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dappnode-test-services-"));
      const firstFile = path.join(tmpDir, "first.service");
      const secondFile = path.join(tmpDir, "second.service");
      try {
        fs.writeFileSync(firstFile, "first");
        fs.writeFileSync(secondFile, "second");
        const result = resolveServicePath("docker-upgrade.service", [firstFile, secondFile]);
        expect(result).to.equal(firstFile);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
