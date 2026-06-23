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
license: GPL-3.0
compatibility: Requires Docker and a reachable DAppNode with MCP enabled. MCP-only upload works with an MCP API key or admin session for /mcp; direct /upload still requires an admin session cookie.
allowed-tools: Read Write Edit Bash dappnode_validate_package dappnode_get_dev_upload_info dappnode_begin_dev_image_upload dappnode_append_dev_image_upload_chunk dappnode_finish_dev_image_upload dappnode_abort_dev_image_upload dappnode_install_dev_package dappnode_get_package_details dappnode_get_package_logs dappnode_start_package dappnode_stop_package dappnode_restart_package dappnode_search_docs dappnode_fetch_doc
metadata:
  author: dappnode
  version: "1.0.0"
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
2. **Run the whole flow yourself.** You scaffold, build, validate, upload,
   install and test. Do not hand command lists to the user and stop. If Docker
   is not running, try to start it; if you cannot, ask the user to start it
   **once** and then continue autonomously.
3. **Use the DAppNode MCP as the source of truth.** Call
   `dappnode_validate_package` on every iteration, and use
   `dappnode_install_dev_package` to test on a real node. These run the exact
   checks the dappmanager applies at install time.
4. **Iterate until it actually works.** Read container logs, `curl` endpoints,
   exec into containers, and fix errors. Do not declare success before the
   service responds correctly.
5. **Keep it minimal.** A working package is `dappnode_package.json` +
   `docker-compose.yml` + a `Dockerfile` (or a public `image:`). Add extras only
   when needed.

## DAppNode MCP connection

The DAppNode MCP server is usually exposed at `http://my.dappnode/mcp`, but
use the exact origin (scheme + host + port) of the MCP connection you are
configured to use. `Authorization: Bearer <MCP_API_KEY>` is scoped to `/mcp`
only. `/upload` requires a normal admin session cookie, so MCP-key clients
should upload dev image tarballs through the chunked MCP upload tools.

All `dappnode_*` tools below are served by that MCP. Before calling any of
them, make sure you are connected to the DAppNode MCP; if you are not,
connect first. For uploads, prefer:

1. `dappnode_begin_dev_image_upload`
2. `dappnode_append_dev_image_upload_chunk` repeatedly
3. `dappnode_finish_dev_image_upload`

This keeps the whole flow inside `POST /mcp` and works for agents that cannot
make a separate authenticated request to the node. Direct `/upload` remains
available only when you have an admin session cookie.

If no bearer token exists yet, generate one in the DAppNode admin UI under
**System > Advanced > MCP API key**. That UI can also revoke or rotate the
token at any time.

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

| File                      | Purpose                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `avatar.png`              | Package icon (PNG, ≤100KB). Required for a real published release; not needed for the local `docker compose` dev loop. For dev installs, a default icon is used automatically, but you may include one if you want a custom icon. |
| `setup-wizard.yml`        | Install-time form (section 4).                                                                                                                                                                                                    |
| `getting-started.md`      | Shown once after install.                                                                                                                                                                                                         |
| `disclaimer.md`           | Must-accept disclaimer text.                                                                                                                                                                                                      |
| `grafana-dashboard.json`  | Grafana dashboard(s) shipped to the DMS. Multiple allowed (`*grafana-dashboard.json`).                                                                                                                                            |
| `prometheus-targets.json` | Prometheus scrape targets.                                                                                                                                                                                                        |
| `notifications.yaml`      | Notification/alert definitions.                                                                                                                                                                                                   |

All are optional. `avatar.png` is required only for a real published release;
for dev installs a default icon is applied automatically. Match the filename
regex exactly or the file is silently ignored.

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

## End-to-end dev workflow (no IPFS)

Do not stop after local testing and ask the user to continue. Run the whole
sequence below in one continuous pass, reading output and fixing errors at each
step.

### 1. Scaffold the package

Create a directory and copy the templates. Edit `dappnode_package.json`,
`docker-compose.yml`, and `Dockerfile` (or use a public `image:`) to match the
service you are packaging.

### 2. Validate locally with Docker

From the package directory:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose logs -f --tail=200
```

If Docker is not running, try to start it. If you cannot start it automatically,
ask the user to start it **once** and then continue autonomously — do not hand
back a list of commands and stop.

Read the logs. If the container exits or restarts, fix the code/compose/env and
repeat this step. Confirm the service actually responds (`curl`, browser, health
endpoint) before moving on.

**Image tag check:** before saving the tarball, verify the built image is tagged
exactly `<service>.<dnpName>:<version>` (single-service packages may omit the
`<service>.` prefix). DAppNode requires this tag. If `docker images` shows a
different tag, rebuild or re-tag with `docker tag <current> <required>`.

### 3. Validate against DAppNode rules

Call `dappnode_validate_package` with the raw contents of
`dappnode_package.json`, `docker-compose.yml` and (if present)
`setup-wizard.yml`. Fix every error it reports, then re-run local validation.

### 4. Build and save the DAppNode image

```bash
docker compose build
docker save <service>.<dnpName>:<version> -o <dnpName>.tar
```

The image tag MUST be exactly `<service>.<dnpName>:<version>` (for a single
service you may omit the `<service>.` prefix). DAppNode forces this tag. If
your image is tagged differently, re-tag it before saving:

```bash
docker tag <current-tag> <service>.<dnpName>:<version>
```

### 5. Upload the image

Get upload details from `dappnode_get_dev_upload_info()` if needed. Prefer the
MCP-native chunked upload flow, especially when authenticating with
`Authorization: Bearer <MCP_API_KEY>`:

1. Compute the tarball byte size and, if possible, SHA-256 digest.
2. Call `dappnode_begin_dev_image_upload({ sizeBytes, sha256?, fileName? })`.
3. Read the tarball locally in chunks no larger than the returned
   `maxChunkBytes`.
4. For each chunk, standard-base64 encode the raw bytes and call
   `dappnode_append_dev_image_upload_chunk({ uploadId, offset, chunkBase64 })`.
   `offset` is the number of raw bytes already accepted.
5. Call `dappnode_finish_dev_image_upload({ uploadId })`.

`dappnode_finish_dev_image_upload` returns `imageFileId`. Use that value in
`dappnode_install_dev_package`.

If you have an admin session cookie and direct network access to the node, you
may instead POST the tarball to `<mcp-origin>/upload`, where `<mcp-origin>` is
the exact scheme + host + port of the MCP server you are using. The generated
MCP bearer token is not accepted by `/upload`:

```bash
curl -X POST <mcp-origin>/upload \
  -H "Cookie: <admin-session-cookie>" \
  -F "file=@<dnpName>.tar"
# → <imageFileId>
```

The direct `/upload` response body is a plain-text file ID, not JSON. Use it
exactly as returned.

Do not hardcode `http://my.dappnode` if it does not resolve from your
environment. If the upload fails because the DAppNode is not reachable, ask
for a reachable address **once**, update the origin, and continue. Do not keep
prompting after every step.

Uploaded files expire after 15 minutes. If you wait longer than that, re-upload
before calling `dappnode_install_dev_package`.

### 6. Install on the DAppNode

Call:

```text
dappnode_install_dev_package({
  manifest: <raw dappnode_package.json>,
  compose: <raw docker-compose.yml>,
  imageFileId: <fileId from upload>,
  setupWizard?: <raw setup-wizard.yml>
})
```

This validates, `docker load`s the image, flags the package as custom, and starts
it — no IPFS, no APM, no signing. Custom packages get a default icon so they show
up with an avatar in the UI; in the future you will be able to upload a custom
`avatar.png` and pass its fileId. This mutates state; confirm with the user
before calling if you have not already.

### 7. Verify on the real node

Use the MCP read tools:

- `dappnode_get_package_details(<dnpName>)` — inspect state, ports, volumes.
- `dappnode_get_package_logs(<dnpName>)` — read logs.
- `curl` the package's DAppNode URL (`http://<service>.<dnpName-without-.eth>`).

Fix any issues locally, rebuild, re-upload and call
`dappnode_install_dev_package` again with the same name to replace it. If the
install fails with "No uploaded file found for imageFileId", the tarball has
expired (15-minute TTL) — re-upload and retry immediately.

### 8. Clean up

When finished:

```bash
docker compose down -v
```

Remove the custom package from the DAppNode like any other package.

## MCP tools to use

Dev-time (offline, no IPFS):

- `dappnode_validate_package` — validate manifest + compose + setup-wizard.
  Call it on every iteration.
- `dappnode_get_dev_upload_info` — return the MCP chunked-upload limits and
  the optional `/upload` endpoint details. Call this if you are unsure how to
  upload.
- `dappnode_begin_dev_image_upload` / `dappnode_append_dev_image_upload_chunk`
  / `dappnode_finish_dev_image_upload` — upload a `docker save` tarball through
  MCP only, returning the `imageFileId` needed by `dappnode_install_dev_package`.
- `dappnode_abort_dev_image_upload` — cancel a failed or no-longer-needed
  MCP-native upload and delete its partial temp file.
- `dappnode_install_dev_package` — install a locally-built package into the
  DAppNode without IPFS, for real end-to-end testing. Appears under the
  "My custom packages" tab. Takes an `imageFileId` returned by the upload step,
  not the raw tarball bytes. This mutates state — confirm with the user before calling.
  Uploaded tarballs expire after 15 minutes, so install promptly after upload.

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
