import type { NetworkPolicy, Intent, MigrationState, ComposeCache } from "../docker-network-migration.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Docker, Journal, buildPlan, composeIntent, execute, inSubnet, verify } from "../docker-network-migration.ts";

test(
  "real Docker: migrate, interrupt, resume, rollback, and start dynamic packages first",
  {
    skip: process.env.DOCKER_NETWORK_TESTS !== "1",
    timeout: 180000
  },
  async () => {
    const docker = new Docker(),
      suffix = `${process.pid}-${Date.now()}`;
    const net = `dappnode-network-test-${suffix}`,
      extra = `${net}-unrelated`;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dappnode-network-test-"));
    const image = process.env.DAPPNODE_NETWORK_TEST_IMAGE || "busybox:1.37.0-musl";
    try {
      execFileSync("docker", ["image", "inspect", image], { stdio: "ignore" });
    } catch {
      execFileSync("docker", ["pull", image], { stdio: "inherit" });
    }
    const names = ["dns", "dynamic", "custom", "stopped"].map((name) => `DAppNodePackage-${name}.${suffix}`);
    const policy: NetworkPolicy = {
      version: 1,
      networks: {
        [net]: {
          subnet: "192.0.2.0/24",
          gateway: "192.0.2.1",
          ipRange: "192.0.2.128/25",
          fixed: { [names[0]]: "192.0.2.2" }
        }
      },
      dynamicNetworks: []
    };
    const ids: string[] = [];
    try {
      await docker.request("POST", "/networks/create", {
        Name: net,
        Driver: "bridge",
        IPAM: { Config: [{ Subnet: "192.0.2.0/24" }] }
      });
      await docker.request("POST", "/networks/create", { Name: extra, Driver: "bridge" });
      const composeFile = path.join(dir, "compose.json");
      fs.writeFileSync(
        composeFile,
        JSON.stringify({
          services: Object.fromEntries(
            names.map((name, i) => [
              name,
              { image, networks: { [net]: i === 2 ? { ipv4_address: "192.0.2.20" } : {} } }
            ])
          ),
          networks: { [net]: { external: true, name: net } }
        })
      );
      for (const [i, name] of names.entries()) {
        const endpoint = {
          Aliases: [name, `service-${i}`],
          IPAMConfig: { IPv4Address: `192.0.2.${i === 2 ? 20 : i + 2}` }
        };
        const created = await docker.request<{ Id: string }>("POST", `/containers/create?name=${name}`, {
          Image: image,
          Cmd: ["sh", "-c", "trap 'exit 0' TERM INT; while :; do sleep 1; done"],
          Labels: {
            "dappnode.dnp.dnpName": name,
            "com.docker.compose.project": `networktest${suffix.replaceAll("-", "")}`,
            "com.docker.compose.service": name,
            "com.docker.compose.project.config_files": composeFile,
            "com.docker.compose.project.working_dir": dir
          },
          HostConfig: { RestartPolicy: { Name: "unless-stopped" }, NetworkMode: net },
          NetworkingConfig: { EndpointsConfig: { [net]: endpoint } }
        });
        ids.push(created.Id);
        if (i !== 3) await docker.request("POST", `/containers/${created.Id}/start`);
      }
      await docker.request("POST", `/networks/${extra}/connect`, {
        Container: ids[1],
        EndpointConfig: { Aliases: ["unrelated-alias"] }
      });
      // Reproduce the original failure on the legacy allocation pool first.
      await docker.request("POST", `/containers/${ids[0]}/stop?t=10`);
      const competitor = await docker.request<{ Id: string }>("POST", "/containers/create", {
        Image: image,
        Cmd: ["sleep", "300"],
        HostConfig: { NetworkMode: net },
        NetworkingConfig: { EndpointsConfig: { [net]: {} } }
      });
      try {
        await docker.request("POST", `/containers/${competitor.Id}/start`);
        assert.equal((await docker.inspect(competitor.Id)).NetworkSettings.Networks[net].IPAddress!, "192.0.2.2");
        await assert.rejects(() => docker.request("POST", `/containers/${ids[0]}/start`), /[Aa]ddress already in use/);
        console.log("Reproduced legacy startup collision before migration");
      } finally {
        await docker.request("DELETE", `/containers/${competitor.Id}?force=true`);
      }
      await docker.request("POST", `/containers/${ids[0]}/start`);
      execFileSync("docker", ["exec", ids[1], "sh", "-c", "echo retained > /migration-marker"]);
      const unrelated = (await docker.inspect(ids[1])).NetworkSettings.Networks[extra];
      const inventory = await docker.inventory(),
        cache: ComposeCache = new Map(),
        intents: Record<string, Intent> = {};
      for (const id of ids) intents[id] = composeIntent(await docker.inspect(id), cache);
      const plan = buildPlan({
        containers: inventory.containers.filter((c) => ids.includes(c.Id)),
        networks: inventory.networks,
        intents,
        policy
      });
      const journal = new Journal(path.join(dir, "state")),
        state: MigrationState = { phase: "prepared", plan };

      // Simulate death immediately after the replacement network is created.
      await assert.rejects(
        () =>
          execute(docker, journal, state, false, async (phase) => {
            if (phase === "networks") throw new Error("simulated interruption");
          }),
        /simulated interruption/
      );
      await execute(docker, journal, journal.read());
      await verify(docker, plan);
      assert.equal(
        execFileSync("docker", ["exec", ids[1], "cat", "/migration-marker"], { encoding: "utf8" }).trim(),
        "retained"
      );
      assert.equal((await docker.inspect(ids[1])).NetworkSettings.Networks[extra].NetworkID, unrelated.NetworkID);
      assert.ok((await docker.inspect(ids[1])).NetworkSettings.Networks[extra].Aliases!.includes("unrelated-alias"));

      // Rollback is also replayable after interruption, with stopped state preserved.
      await assert.rejects(
        () =>
          execute(docker, journal, journal.read(), true, async (phase) => {
            if (phase === "rollback-networks") throw new Error("interrupted rollback");
          }),
        /interrupted rollback/
      );
      await execute(docker, journal, journal.read(), true);
      await verify(docker, plan, true);
      await execute(docker, journal, journal.read());

      // Wrong startup order must be harmless: ordinary packages get only pool IPs.
      for (const id of ids) await docker.request("POST", `/containers/${id}/stop?t=10`);
      for (const id of [ids[1], ids[2], ids[0]]) await docker.request("POST", `/containers/${id}/start`);
      await verify(docker, plan);
      assert.ok(inSubnet((await docker.inspect(ids[1])).NetworkSettings.Networks[net].IPAddress!, "192.0.2.128/25"));
      assert.equal((await docker.inspect(ids[0])).NetworkSettings.Networks[net].IPAddress!, "192.0.2.2");
      assert.equal((await docker.inspect(ids[2])).NetworkSettings.Networks[net].IPAddress!, "192.0.2.20");
      assert.equal((await docker.inspect(ids[3])).State.Running, false);
      console.log(
        "Verified container IDs, writable-layer data, custom static, aliases, unrelated attachment, interruption, rollback and startup order"
      );
    } finally {
      for (const id of ids) await docker.request("DELETE", `/containers/${id}?force=true`, undefined, [204, 404]);
      for (const name of [net, extra]) await docker.request("DELETE", `/networks/${name}`, undefined, [204, 404]);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
);
