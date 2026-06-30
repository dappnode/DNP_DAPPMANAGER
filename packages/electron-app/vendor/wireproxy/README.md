# wireproxy binaries

`yarn desktop` downloads a pinned `wireproxy` binary here automatically for development.

Place platform-specific `wireproxy` binaries here when packaging the desktop app:

```txt
vendor/wireproxy/darwin-arm64/wireproxy
vendor/wireproxy/darwin-x64/wireproxy
vendor/wireproxy/linux-x64/wireproxy
vendor/wireproxy/win32-x64/wireproxy.exe
```

For development, you can also point to any local binary:

```sh
DAPPNODE_WIREPROXY_PATH=/absolute/path/to/wireproxy yarn desktop
```

The Electron main process runs `wireproxy` as a userspace WireGuard client with a local SOCKS5 listener. DAppmanager backend traffic from this app is sent through that SOCKS5 listener; no system VPN interface or global routes are created.
