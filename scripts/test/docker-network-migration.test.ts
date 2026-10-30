import type { Container, DockerNetwork, NetworkPolicy, Intent, Mount } from "../docker-network-migration.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Docker,
  buildPlan,
  defaultPolicy,
  inSubnet,
  Journal,
  resolveComposePath,
  shutdownPriority
} from "../docker-network-migration.ts";

const policy: NetworkPolicy = {
  version: 1,
  networks: {
    test: { subnet: "10.20.0.0/24", gateway: "10.20.0.1", ipRange: "10.20.0.128/25", fixed: { dns: "10.20.0.2" } }
  },
  dynamicNetworks: []
};
const network: DockerNetwork = {
  Name: "test",
  Scope: "local",
  Driver: "bridge",
  IPAM: { Driver: "default", Config: [{ Subnet: "10.20.0.0/24", Gateway: "10.20.0.1" }] }
};
function container(name: string, ip: string, running = true): Container {
  return {
    Id: name,
    Name: `/${name}`,
    Image: "image",
    Mounts: [],
    HostConfig: { RestartPolicy: { Name: "unless-stopped" } },
    State: { Running: running },
    Config: { Labels: { "dappnode.dnp.dnpName": name } },
    NetworkSettings: {
      Networks: { test: { IPAddress: ip, IPAMConfig: { IPv4Address: ip }, Aliases: [name, `${name}.dappnode`] } }
    }
  };
}
const make = (
  containers: Container[],
  intents: Record<string, Intent> = Object.fromEntries(containers.map((c) => [c.Id, {}])),
  networks = [network]
) => buildPlan({ containers, intents, networks, policy });

test("stale observed addresses are removed; core addresses and aliases survive", () => {
  const containers = [container("dns", "10.20.0.2"), container("signer", "10.20.0.13")];
  const saved = structuredClone(containers),
    plan = make(containers);
  assert.deepEqual(plan.containers[0].desired.test.IPAMConfig, { IPv4Address: "10.20.0.2" });
  assert.deepEqual(plan.containers[1].desired.test.IPAMConfig, {});
  assert.deepEqual(plan.containers[1].desired.test.Aliases, ["signer", "signer.dappnode"]);
  assert.deepEqual(containers, saved);
  assert.equal(plan.networks[0].desired.IPAM.Config[0].IPRange, "10.20.0.128/25");
});
test("explicit custom addresses outside the pool are preserved", () => {
  const plan = make([container("custom", "10.20.0.20")], { custom: { test: { ipv4_address: "10.20.0.20" } } });
  assert.equal(plan.containers[0].desired.test.IPAMConfig.IPv4Address, "10.20.0.20");
});
test("restore declared aliases without losing existing aliases", () => {
  const plan = make([container("app", "10.20.0.20")], { app: { test: { aliases: ["declared-alias"] } } });
  assert.deepEqual(plan.containers[0].desired.test.Aliases, ["app", "app.dappnode", "declared-alias"]);
});
test("clean undeclared pins on public/staking networks without recreating their bridges", () => {
  const c = container("app", "10.20.0.20");
  c.NetworkSettings.Networks.external = c.NetworkSettings.Networks.test;
  delete c.NetworkSettings.Networks.test;
  const external = structuredClone(network);
  external.Name = "external";
  const p = structuredClone(policy);
  p.dynamicNetworks = ["external"];
  const plan = buildPlan({
    containers: [c],
    networks: [external],
    intents: { app: { external: { aliases: ["https.external"] } } },
    policy: p
  });
  assert.equal(plan.networks[0].recreate, false);
  assert.deepEqual(plan.containers[0].desired.external.IPAMConfig, {});
  assert.ok(plan.containers[0].desired.external.Aliases!.includes("https.external"));
  assert.ok(defaultPolicy.dynamicNetworks.includes("dnpublic_network"));
});
test("custom statics inside the automatic pool fail before mutations", () => {
  assert.throws(
    () => make([container("custom", "10.20.0.150")], { custom: { test: { ipv4_address: "10.20.0.150" } } }),
    /outside/
  );
});
test("reserved core addresses cannot be assigned to another package", () => {
  assert.throws(
    () => make([container("custom", "10.20.0.2")], { custom: { test: { ipv4_address: "10.20.0.2" } } }),
    /reserved for dns/
  );
});
test("duplicate intentional static addresses are rejected", () => {
  assert.throws(
    () =>
      make([container("a", "10.20.0.20"), container("b", "10.20.0.20")], {
        a: { test: { ipv4_address: "10.20.0.20" } },
        b: { test: { ipv4_address: "10.20.0.20" } }
      }),
    /Duplicate/
  );
});
test("gateway, subnet edges and auxiliary addresses cannot be used as container statics", () => {
  for (const ip of ["10.20.0.0", "10.20.0.1", "10.20.0.255"])
    assert.throws(() => make([container("custom", ip)], { custom: { test: { ipv4_address: ip } } }), /reserved/);
  const n = structuredClone(network);
  n.IPAM.Config[0].AuxiliaryAddresses = { router: "10.20.0.20" };
  assert.throws(
    () => make([container("custom", "10.20.0.20")], { custom: { test: { ipv4_address: "10.20.0.20" } } }, [n]),
    /reserved/
  );
});
test("legacy core Compose provenance is accepted without new-style Dappnode labels", () => {
  const c = container("DAppNodeCore-https.dnp.dappnode.eth", "10.20.0.20");
  c.Config.Labels = { "com.docker.compose.project": "dncore", "com.docker.compose.service": "https.dnp.dappnode.eth" };
  assert.equal(make([c]).containers.length, 1);
});
test("host Compose paths resolve through inherited configuration mounts", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compose-path-"));
  try {
    fs.writeFileSync(path.join(dir, "compose.yml"), "services: {}");
    assert.equal(
      resolveComposePath("/not-mounted-host/DNCORE/compose.yml", [
        { Source: "/not-mounted-host/DNCORE", Destination: dir }
      ]),
      path.join(dir, "compose.yml")
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("stopped containers count toward capacity and stay stopped", () => {
  const containers = Array.from({ length: 127 }, (_, i) => container(`package-${i}`, "", false));
  assert.throws(() => make(containers), /127 dynamic endpoints; capacity is 126/);
  const plan = make(containers.slice(0, 1));
  assert.equal(plan.containers[0].running, false);
});
test("unmanaged containers, missing intent and custom subnets block migration", () => {
  const c = container("custom", "10.20.0.20");
  delete c.Config.Labels!["dappnode.dnp.dnpName"];
  assert.throws(() => make([c]), /Unmanaged/);
  assert.throws(() => make([container("custom", "10.20.0.20")], {}), /No resolved Compose/);
  const n = structuredClone(network);
  n.IPAM.Config[0].Subnet = "10.21.0.0/24";
  assert.throws(() => make([], {}, [n]), /Unexpected subnet/);
});
test("compatible existing pool is not recreated and custom gateway is retained", () => {
  const n = structuredClone(network);
  n.IPAM.Config[0].IPRange = policy.networks.test.ipRange;
  n.IPAM.Config[0].Gateway = "10.20.0.126";
  const plan = make([], {}, [n]);
  assert.equal(plan.networks[0].recreate, false);
  assert.equal(plan.networks[0].desired.IPAM.Config[0].Gateway, "10.20.0.126");
});
test("policy keeps every required core address outside automatic allocation", () => {
  for (const p of Object.values(defaultPolicy.networks))
    for (const ip of Object.values(p.fixed)) {
      assert.ok(inSubnet(ip, p.subnet));
      assert.ok(!inSubnet(ip, p.ipRange));
    }
  assert.equal(inSubnet("172.33.128.0", "172.33.128.0/17"), true);
  assert.equal(inSubnet("172.33.1.7", "172.33.128.0/17"), false);
  assert.throws(() => inSubnet("300.1.1.1", "10.0.0.0/8"), /Invalid/);
});
test("stop the core coordinator before the manager and the ordinary services", () => {
  const target = (name: string, mounts: Pick<Mount, "Destination">[] = []) => ({ name, mounts });
  const coordinator = target("DAppNodeCore-core.dnp.dappnode.eth");
  const manager = target("DAppNodeCore-dappmanager.dnp.dappnode.eth");
  const app = target("DAppNodePackage-app.dnp.dappnode.eth");
  const controller = target("DAppNodePackage-controller.dnp.dappnode.eth", [{ Destination: "/var/run/docker.sock" }]);
  assert.deepEqual(
    [app, manager, coordinator, controller].sort((a, b) => shutdownPriority(a) - shutdownPriority(b)),
    [coordinator, controller, manager, app]
  );
});
test("journal is private, atomic and refuses concurrent owners", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "network-journal-"));
  try {
    const journal = new Journal(dir);
    journal.write({ phase: "prepared" });
    assert.deepEqual(journal.read(), { phase: "prepared" });
    assert.equal(fs.statSync(path.join(dir, "journal.json")).mode & 0o777, 0o600);
    const unlock = await journal.lock(new Docker());
    await assert.rejects(() => journal.lock(new Docker()), /holds the lock/);
    unlock();
    fs.writeFileSync(path.join(dir, "lock.json"), JSON.stringify({ host: os.hostname(), pid: 2000000000 }));
    const release = await journal.lock(new Docker());
    release();
    assert.deepEqual(fs.readdirSync(dir), ["journal.json"]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
