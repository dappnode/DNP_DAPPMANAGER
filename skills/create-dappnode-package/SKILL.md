---
name: create-dappnode-package
description: >-
  Create, develop and debug a DAppNode package (DNP) with a fast, local,
  IPFS-free loop. Use when the user wants to build a new DAppNode package,
  wrap an existing Docker image as a DAppNode package, or fix a package that
  won't install/run. Covers the manifest (dappnode_package.json),
  docker-compose.yml, Dockerfile and setup-wizard, the DAppNode-specific
  compose rules, and how to validate + debug the package using Docker and the
  DAppNode MCP server. NOT for managing already-installed packages on a
  running node — use the MCP package tools directly for that.
---

# Create a DAppNode package

A DAppNode package (DNP) is just a Docker Compose project plus a manifest and
some metadata. Distribution happens over IPFS, but **you never need IPFS while
developing**. Build and run it with plain Docker, debug it yourself by reading
container logs, and validate it against DAppNode's rules with the MCP. Only
produce an IPFS hash at the very end, when you publish a release.

## Golden rules

1. **Never build an IPFS hash during development.** Do NOT run
   `dappnodesdk build` / `publish` in the dev loop — it is slow and uploads to
   IPFS. Use `docker compose` locally instead.
2. **The agent debugs the package itself.** Build it, start it, read its logs,
   exec into it, curl its endpoints. Iterate until it actually runs. Don't hand
   a broken package to the user.
3. **You MUST use the DAppNode MCP** to validate the package and (optionally) to
   test it on a real node. The key dev-time tool is `dappnode_validate_package`,
   which runs the exact manifest + compose + setup-wizard checks the dappmanager
   applies at install time — fast and offline, no IPFS.
4. **Keep it minimal.** A working package is `dappnode_package.json` +
   `docker-compose.yml` + a `Dockerfile` (or a public `image:`). Add a
   setup-wizard, backup, notifications, etc. only when needed.

## Package anatomy

```
my-package/
├── dappnode_package.json   # manifest (required) — metadata + DAppNode config
├── docker-compose.yml      # compose (required) — services, volumes, networks
├── Dockerfile              # only if you build the image yourself
└── setup-wizard.yml        # optional — install-time user inputs (env/ports/files)
```

Copy-paste starting points are bundled with this skill in
[templates/](templates/): `dappnode_package.json`, `docker-compose.yml`,
`Dockerfile`, `setup-wizard.yml`. Start from those and edit.

Package name is an ENS name: `<name>.dnp.dappnode.eth` (community) or
`<name>.public.dappnode.eth`.

## 1. Manifest — `dappnode_package.json`

Start from [templates/dappnode_package.json](templates/dappnode_package.json).
Required fields: `name`, `version`, `description`, `type`, `license`.

```json
{
  "name": "my-package.dnp.dappnode.eth",
  "version": "0.1.0",
  "description": "What this package does.",
  "type": "service",
  "author": "You <you@example.com>",
  "license": "GPL-3.0",
  "categories": ["Blockchain"],
  "links": { "homepage": "https://github.com/you/my-package" }
}
```

Notes:
- `version` is strict semver `x.y.z` (no `v` prefix). First APM-publishable
  versions are `0.0.1`, `0.1.0` or `1.0.0`.
- `type`: `service` (normal package), `library` (no ENVs, can't depend on
  `service` packages — only provides deps), or `dncore` (DAppNode core, special
  permissions — not for third parties).
- For packages that just wrap upstream software, pin its version with EITHER the
  legacy trio `upstreamRepo` + `upstreamVersion` + `upstreamArg` (all three
  together) OR the newer `upstream` array (`[{ repo, version, arg }]`) for
  multiple upstreams. The two forms are mutually exclusive. `arg` is the
  docker-compose `build.args` name that carries the version (default convention
  `UPSTREAM_VERSION`).
- `shortDescription` (6–8 words, plain text, no markdown) vs `description`
  (markdown + links encouraged). Both are shown in the package store.
- `chain` marks the package as a blockchain node so the UI shows sync status.
  Value is a driver string (`ethereum`, `ethereum-beacon-chain`,
  `ethereum2-beacon-chain-prysm`, `bitcoin`, `monero`) or an object
  `{ driver, serviceName?, portNumber? }`. Each driver expects a specific RPC on
  a specific port (e.g. `ethereum` → JSON-RPC on 8545, `bitcoin` → 8332).
- `mainService` — for multi-service packages, which service the root
  `<name>.dappnode` domain maps to.
- `dependencies` / `optionalDependencies` — map of `<dnpName>: <semver | range |
  latest | /ipfs/Hash>`. During dev you can point a dep at an IPFS hash.
- `requirements` — `minimumDappnodeVersion`, `minimumDockerVersion` (both strict
  `x.y.z`), `notInstalledPackages` (conflicts).
- `globalEnvs` — ask the DAPPMANAGER to inject global envs (e.g.
  `_DAPPNODE_GLOBAL_PUBLIC_IP`); can be scoped to specific services.
- `backup` — array of `{ name, path, service? }`; `path` must be ABSOLUTE (no
  `~`). Adds a backup/restore view in the UI. Back up only small config/keys.
- `exposable` — array of `{ name, port, serviceName?, description?,
  exposeByDefault? }` HTTPS services the user can expose over the public
  internet via the HTTPS portal.
- `warnings` (`onInstall`/`onUpdate`/`onReset`/`onRemove`…), `updateAlerts`
  (per `from`/`to` semver jump), `disclaimer` (must-accept popup),
  `changelog`, `dockerTimeout` (override the 10s docker timeout).
- `architectures` — `["linux/amd64", "linux/arm64"]` to build multi-arch.
- `categories` is an enum (Blockchain, Communications, Developer tools, ETH2.0,
  Economic incentive, Monitoring, Payment channels, Storage, Lido, DVT, LSD, AI,
  MCP). Using a non-enum category fails validation.
- Metadata: `author`/`contributors` must follow `Name <email> (githubUrl)`;
  `links` (`homepage`/`ui`/`api`/`gateway` get icons, others shown plain),
  `repository` (`{ type, url }`), `bugs` (`{ url }`), `keywords`, `style`.
- The canonical manifest JSON Schema lives in the DAppNode dappmanager repo
  (`@dappnode/schemas`) and is enforced for you at validation time by the
  `dappnode_validate_package` MCP tool — you don't need a local copy.

## 2. docker-compose.yml — DAppNode rules

Start from [templates/docker-compose.yml](templates/docker-compose.yml). It's a
normal compose file, but DAppNode enforces these constraints (all checked by the
`dappnode_validate_package` MCP tool):

- **Compose version ≥ 3.4** (`version: "3.5"` is typical).
- **Image tag must match the manifest**: `<service>.<dnpName>:<version>`, e.g.
  `my-package.dnp.dappnode.eth:0.1.0`. For multi-service packages, prefix with
  the service name: `beacon.my-package.dnp.dappnode.eth:0.1.0`.
- **Networks**: only the whitelisted external networks are allowed
  (`dncore_network`, `dnprivate_network`, `dnpublic_network`) and they must be
  `external: true`. Most packages omit `networks` entirely and let DAppNode wire
  them up.
- **No `container_name`** — DAppNode names containers itself.
- **Volumes** must use the short string syntax (`name:/path`), and named volumes
  must be declared under top-level `volumes:`. Bind mounts to host paths are
  forbidden for non-core packages.
- **`restart: unless-stopped`** on every service.
- Non-core packages **cannot** use `privileged: true`, `network_mode: host`, or a
  custom `dns` (the node injects the DAppNode DNS `172.33.1.2`). `pid` may only
  be `service:<name>`, never `host`.
- Reach other packages over the internal DNS: `<service>.<dnpName-without-.eth>`,
  e.g. `http://geth.dappnode:8545`, `http://my-package.dappnode`.

Minimal single-service example:

```yaml
version: "3.5"
services:
  my-package:
    image: "my-package.dnp.dappnode.eth:0.1.0"
    build:
      context: .
    restart: unless-stopped
    volumes:
      - "data:/data"
    ports:
      - "8080"
    environment:
      EXTRA_OPTS: ""
volumes:
  data: {}
```

## 3. Dockerfile

Start from [templates/Dockerfile](templates/Dockerfile). Standard Dockerfile. If
you wrap upstream software pinned by the manifest, accept it as a build arg:

```dockerfile
ARG UPSTREAM_VERSION
FROM upstream/image:${UPSTREAM_VERSION}
COPY entrypoint.sh /usr/local/bin/
ENTRYPOINT ["entrypoint.sh"]
```

Prefer a known public `image:` (no Dockerfile/`build:`) when you don't need to
customize it.

## 4. setup-wizard.yml (optional)

Start from [templates/setup-wizard.yml](templates/setup-wizard.yml). Defines the
fields the user fills in at install time. Hard requirements (from the actual
schema):
- Top level: `version: "2"` (string, must be exactly `"2"`) and `fields: []`.
- Each field requires `id`, `title`, `description`. Optional: `secret` (mask
  input), `pattern` + `patternErrorMessage`, `enum`, `required`, `if`
  (conditional display).
- `target` binds the field to the compose. One of:
  - `{ type: environment, name, service? }` — set an env var. `service` may be a
    string or array; required for multi-service packages.
  - `{ type: portMapping, containerPort, service? }` — `containerPort` is a
    STRING, e.g. `"8080"` or `"8080/UDP"`.
  - `{ type: namedVolumeMountpoint, volumeName }` — let the user pick the disk
    for a named volume.
  - `{ type: allNamedVolumesMountpoint }` — same, for all volumes at once.
  - `{ type: fileUpload, path, service? }` — upload a file to an absolute path.
Validate with `dappnode_validate_package`. The env/port/volume a field targets
MUST actually exist in the compose.

## 5. Optional release files

These extra files are picked up by name when the package is built/installed.
Filename matching is by regex — use these exact names to be safe:

| File | Purpose |
|------|---------|
| `avatar.png` | Package icon (PNG, ≤100KB). Required for a real published release; not needed for the local `docker compose` dev loop. |
| `setup-wizard.yml` | Install-time form (section 4). |
| `getting-started.md` | Shown once after install. |
| `disclaimer.md` | Must-accept disclaimer text. |
| `grafana-dashboard.json` | Grafana dashboard(s) shipped to the DMS. Multiple allowed (`*grafana-dashboard.json`). |
| `prometheus-targets.json` | Prometheus scrape targets. |
| `notifications.yaml` | Notification/alert definitions. |

All are optional except `avatar.png` (only required at publish time). Match the
filename regex exactly or the file is silently ignored.

## SDK commands & options (reference)

The SDK (`@dappnode/dappnodesdk`, run via `npx @dappnode/dappnodesdk <cmd>`) is
only for scaffolding and the final publish — NOT for the dev loop.

`dappnodesdk init [-y] [-f] [--use-variants]` — scaffold a package. `--use-variants`
creates a multi-variant template (see below). Default files: `dappnode_package.json`,
`docker-compose.yml`, `Dockerfile`, variants dir `package_variants/`.

`dappnodesdk build` — **builds the IPFS hash; do NOT use in the dev loop.** Useful
flags when you DO publish a test build:
- `-p, --provider <ipfs>` (default `dappnode`; e.g. `infura`, `localhost:5002`).
- `--upload-to <ipfs|swarm>` (default `ipfs`).
- `-t, --timeout <60min>` build timeout.
- `--skip-save` / `--skip-upload` — testing only.
- `--skip-compose-validation` — skip the DAppNode compose check (don't — the MCP
  `dappnode_validate_package` tool already gives you that offline).
- `--all-variants` / `--variants <a,b>` / `--variants-dir-name <dir>`.

`dappnodesdk publish <patch|minor|major>` — build + create the APM release
transaction (authorized dev only).

### Package variants (special case)

For packages that ship as several near-identical builds (e.g. one per network),
the SDK supports variants: a root `dappnode_package.json` + `docker-compose.yml`
holding the shared base, and a `package_variants/<name>/` dir per variant whose
`dappnode_package.json` / `docker-compose.yml` are DEEP-MERGED over the base at
build time. The default selector env is `NETWORK` (`mainnet`/`testnet`). When
developing a variant locally, merge the base + variant compose yourself (or just
work on one concrete compose) and validate the merged result with
`dappnode_validate_package` — still no IPFS needed.

## The fast dev loop (no IPFS)

Run everything from the package directory. You (the agent) drive Docker and read
the output — don't ask the user to do it.

1. **Scaffold** the files above — copy from [templates/](templates/) and edit
   (or run `dappnodesdk init` to generate them, then stop — do NOT build/publish).
2. **Validate structure** with Docker's own parser:
   ```bash
   docker compose config
   ```
3. **Validate DAppNode rules** via the MCP tool `dappnode_validate_package`,
   passing the raw contents of `dappnode_package.json`, `docker-compose.yml` and
   (if present) `setup-wizard.yml`. Fix every reported error. This is the
   IPFS-free equivalent of the install-time checks.
4. **Build the image** locally:
   ```bash
   docker compose build
   ```
5. **Run it** and watch it:
   ```bash
   docker compose up -d
   docker compose logs -f --tail=200
   ```
6. **Debug yourself**: read the logs, `docker compose ps` for state/health,
   `docker compose exec <service> sh` to poke inside, `curl` exposed ports. If a
   container restarts/exits, read the logs, fix the Dockerfile/compose/env, and
   go back to step 2.
7. **Repeat** until the service is healthy and does what it should.
8. **Clean up** when done:
   ```bash
   docker compose down -v
   ```

## Install & test on your DAppNode (no IPFS)

When the package runs cleanly in the local loop above, install it straight into
the DAppNode — still **without IPFS** — to test it inside the real DAppNode
environment (networks, global envs, DNS, the UI). It lands under the
**"My dev packages"** tab in the Packages page, kept separate from packages
installed from the registry.

Use the MCP tool **`dappnode_install_dev_package`**. The only extra requirement
vs. the local loop is delivering the already-built image:

1. **Build** the image with the exact DAppNode tag (the compose `image:` field
   already is `<service>.<dnpName>:<version>` — see the compose rules):
   ```bash
   docker compose build
   ```
2. **Save** it to a tarball at a path the dappmanager can read on the host:
   ```bash
   docker save <service>.<dnpName>:<version> -o /path/on/host/<dnpName>.tar
   ```
   For a multi-service package, `docker save` every service image into the tar.
3. **Install** via the MCP tool, passing the raw `dappnode_package.json` and
   `docker-compose.yml` contents plus `imageTarPath` (and optionally
   `setup-wizard.yml`):
   - `dappnode_install_dev_package({ manifest, compose, imageTarPath, setupWizard? })`
   - It validates the files, `docker load`s the image, tags the package as a dev
     package, and starts it — no IPFS, no APM, no signing.
4. **Verify on the node** with the read-only MCP tools
   (`dappnode_get_package_details`, `dappnode_get_package_logs`, …) and in the
   UI under Packages → **My dev packages**.
5. **Iterate**: rebuild, re-save, and call `dappnode_install_dev_package` again
   with the same name to replace it. Remove it like any package when done.

Image tag MUST match `<service>.<dnpName>:<version>` exactly — DAppNode forces
that image tag in the compose, so a mismatched `docker save` tag will fail to
start. Always run `dappnode_validate_package` first.

## MCP tools to use

Dev-time (offline, no IPFS):
- `dappnode_validate_package` — validate manifest + compose + setup-wizard.
  Call it on every iteration.
- `dappnode_install_dev_package` — install a locally-built package into the
  DAppNode without IPFS, for real end-to-end testing. Appears under the
  "My dev packages" tab. Needs a `docker save` image tarball (see the section
  above). This mutates state — confirm with the user before calling.

Optional, to test the finished package on a real DAppNode after you've installed
it there:
- `dappnode_get_package_details` — inspect containers, ports, volumes.
- `dappnode_get_package_logs` — read logs of an installed package.
- `dappnode_start_package` / `dappnode_stop_package` / `dappnode_restart_package`.
- `dappnode_search_docs` / `dappnode_fetch_doc` — official docs at
  docs.dappnode.io are the source of truth for concepts and conventions.

If the dev loop needs a capability the MCP doesn't expose yet, that tool has to
be added to the DAppNode dappmanager itself (the `dappnode_*` tool registry in
its `src/mcp/tools.ts`) — note it for the user rather than working around it.

## Publishing (only when development is finished)

This is the ONLY step that touches IPFS, and it is not part of the dev loop:

```bash
# Produce an installable IPFS hash for testers:
dappnodesdk build

# Or build + create the APM release transaction (authorized dev only):
dappnodesdk publish <patch|minor|major>
```

Install the resulting IPFS hash on a real node (UI, or the MCP
`dappnode_install_package` with the hash as `version`) only for final
end-to-end testing.

## Common mistakes (AI agents make these a lot)

Process / approach:
- **Building an IPFS hash to "test"** (`dappnodesdk build`/`publish`) during the
  dev loop. It's slow and uploads to IPFS. Use `docker compose` — see rule 1.
- **Declaring success without running it.** Always `docker compose up -d`, read
  the logs, and confirm the service actually works before reporting done.
- **Asking the user to run Docker commands.** You run them and read the output.
- **Editing files blindly.** Re-run `dappnode_validate_package` after every
  change instead of guessing.
- **Trusting the docs over the schema.** The MCP validator and `@dappnode/schemas`
  are the source of truth; docs can lag.

Manifest:
- **`version` with a `v` prefix or non-`x.y.z`** (e.g. `v1.0.0`, `1.0`,
  `1.0.0-rc1`). Must be strict semver `x.y.z`. Same for `minimumDappnodeVersion`.
- **Mixing `upstream` with `upstreamRepo`/`upstreamVersion`/`upstreamArg`** —
  they're mutually exclusive; the trio must all be present together.
- **Invalid `categories`** — it's a fixed enum; a free-text category fails.
- **Malformed `author`/`contributors`** — must be `Name <email> (githubUrl)`.
- **Relative `backup.path` or using `~`** — must be an absolute path.
- **Putting `container_name` / `version` mismatch / extra unknown top-level keys**
  → schema rejects unknown fields.

Compose:
- **Image tag mismatch** — `image:` must be EXACTLY
  `<service>.<dnpName>:<manifestVersion>` (single service may omit the service
  prefix: `<dnpName>:<version>`). A wrong tag, wrong version, or a public image
  name is rejected.
- **`version` < 3.4** — minimum compose file version is 3.4.
- **Non-whitelisted or non-external networks** — only `dncore_network`,
  `dnprivate_network`, `dnpublic_network`, and they must be `external: true`.
  Usually just delete the `networks` block entirely.
- **`privileged: true`, `network_mode: host`, custom `dns`, or `pid: host`** —
  forbidden for non-core packages (`pid` may only be `service:<name>`).
- **`container_name`** — never set it; DAppNode names containers.
- **Long/object volume syntax or host bind-mounts** — use short string syntax
  `name:/path` with named volumes declared under top-level `volumes:`.
- **Missing `restart: unless-stopped`** on a service.
- **Disallowed compose keys** — only a whitelist of service keys is permitted;
  exotic keys (e.g. `deploy`, arbitrary `cap_add`) are rejected.

Networking / runtime:
- **Using `localhost`/`127.0.0.1` to reach other packages** — use the internal
  DNS `<service>.<name>.dappnode` (e.g. `http://geth.dappnode:8545`).
- **Hardcoding host ports** — prefer container-only `ports: ["8080"]` and let the
  user/setup-wizard pick the host port.

Setup-wizard:
- **`version` not the string `\"2\"`**, or a `target` pointing at an env/port/volume
  that doesn't exist in the compose.
- **`containerPort` as a number** — it must be a string (`\"8080\"`).

Release files:
- **Wrong filename** — files are matched by regex; e.g. a dashboard must end in
  `grafana-dashboard.json`, targets must match `*prometheus-targets.json`. A
  misnamed file is silently ignored.
