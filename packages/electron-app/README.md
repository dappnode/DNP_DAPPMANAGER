# DAppNode Electron App

This workspace wraps the existing `@dappnode/admin-ui` build in Electron.

Run it from the repository root after `packages/admin-ui/build` exists:

```sh
yarn desktop
```

The app asks how to reach Dappmanager on first launch, stores that choice in Electron's `userData` folder, then serves the built Admin UI from `127.0.0.1` and proxies API and Socket.IO traffic to the backend. This keeps the existing frontend using same-origin `/login-status`, `/rpc`, `/socket.io`, and download routes.

## App-only WireGuard tunnel

The connection screen can also store a WireGuard config and start an app-scoped tunnel. This uses `wireproxy`, a userspace WireGuard client that exposes a local SOCKS5 proxy, so the desktop app can route only Dappmanager backend traffic through WireGuard without changing host routes or affecting other applications.

For development, `yarn desktop` automatically downloads the pinned `wireproxy` binary for your platform into `packages/electron-app/vendor/wireproxy/`.

Normal tunnel flow:

1. Run `yarn desktop`.
2. Choose `WireGuard tunnel`.
3. Paste or select your WireGuard `.conf` file.
4. Click `Connect`.

Tunnel mode automatically uses `http://172.33.1.7`, the Dappmanager internal core IP.

Manual override, if you want to use your own binary:

```sh
DAPPNODE_WIREPROXY_PATH=/absolute/path/to/wireproxy yarn desktop
```

Packaged builds should include a platform binary at:

```txt
resources/wireproxy/<platform>-<arch>/wireproxy
```

For local development, the fallback path is:

```txt
packages/electron-app/vendor/wireproxy/<platform>-<arch>/wireproxy
```

The WireGuard config contains a private key and is written to Electron's `userData` folder as `wireguard.conf` with `0600` permissions where supported.

Useful commands:

```sh
yarn workspace @dappnode/electron-app start
yarn workspace @dappnode/electron-app start:with-ui-build
yarn workspace @dappnode/electron-app build
```

For packaged builds, include `packages/admin-ui/build` as an `admin-ui` resource or point the app to a build with:

```sh
DAPPNODE_ADMIN_UI_PATH=/absolute/path/to/admin-ui/build yarn workspace @dappnode/electron-app start
```

## Build installers

Run these commands from the repository root. The installer scripts compile the Electron main process, download the pinned `wireproxy` helper if needed, and bundle the existing `packages/admin-ui/build` folder.

macOS DMG:

```sh
yarn desktop:dist:mac
```

The DMG is written to:

```txt
packages/electron-app/release/DAppNode Desktop-0.1.0-arm64.dmg
```

Windows installer:

```sh
yarn desktop:dist:win
```

Build the Windows installer on Windows, or on a Windows CI runner. Cross-building the NSIS installer from macOS may require Wine and is less reliable. The `.exe` output is written to `packages/electron-app/release/`.

To fail the build if the tunnel helper cannot be downloaded or bundled, use:

```sh
DAPPNODE_REQUIRE_WIREPROXY=1 yarn desktop:dist:mac
DAPPNODE_REQUIRE_WIREPROXY=1 yarn desktop:dist:win
```

The app icons are generated from the DAppNode mark and live in `packages/electron-app/resources/`:

```txt
icon.png
icon.icns
icon.ico
```

Unsigned builds are fine for quick sharing and testing, but macOS Gatekeeper and Windows SmartScreen will warn users. For broader distribution, sign the macOS app with an Apple Developer ID certificate and notarize it; sign the Windows installer with an Authenticode code-signing certificate.
