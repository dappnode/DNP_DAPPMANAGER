# create-dappnode-package

Agent skill for creating, developing and debugging DAppNode packages (DNPs)
with a fast, local, IPFS-free loop.

## Install

```bash
npx skills add https://github.com/dappnode/DNP_DAPPMANAGER/tree/main/skills/create-dappnode-package
```

To install only for OpenCode:

```bash
npx skills add https://github.com/dappnode/DNP_DAPPMANAGER/tree/main/skills/create-dappnode-package -a opencode
```

## What it does

Scaffolds a DAppNode package, runs it locally with Docker, validates it via the
DAppNode MCP, uploads the image to the DAppNode, installs it as a dev package,
and verifies it on the real node.
