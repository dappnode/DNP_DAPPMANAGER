#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const https = require("node:https");
const path = require("node:path");
const zlib = require("node:zlib");

const VERSION = "v1.1.2";
const RELEASE_BASE_URL = `https://github.com/windtf/wireproxy/releases/download/${VERSION}`;
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const BINARY_NAME = process.platform === "win32" ? "wireproxy.exe" : "wireproxy";
const DEST_DIR = path.join(PACKAGE_ROOT, "vendor/wireproxy", `${process.platform}-${process.arch}`);
const DEST_PATH = path.join(DEST_DIR, BINARY_NAME);
const STRICT = process.env.DAPPNODE_REQUIRE_WIREPROXY === "1";

const assetArchByNodeArch = {
  arm: "arm",
  arm64: "arm64",
  ia32: "386",
  x64: "amd64"
};

const assetPlatformByNodePlatform = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows"
};

main().catch((error) => fail(error.message || String(error)));

async function main() {
  if (process.env.DAPPNODE_SKIP_WIREPROXY_DOWNLOAD === "1") {
    console.log("wireproxy download skipped by DAPPNODE_SKIP_WIREPROXY_DOWNLOAD=1");
    return;
  }

  if (process.env.DAPPNODE_WIREPROXY_PATH) {
    console.log("wireproxy download skipped because DAPPNODE_WIREPROXY_PATH is set");
    return;
  }

  if (fs.existsSync(DEST_PATH)) {
    await makeExecutable(DEST_PATH);
    console.log(`wireproxy already available at ${DEST_PATH}`);
    return;
  }

  const assetName = getAssetName();
  if (!assetName) {
    fail(`No bundled wireproxy asset is configured for ${process.platform}-${process.arch}`);
    return;
  }

  console.log(`Downloading wireproxy ${VERSION} for ${process.platform}-${process.arch}...`);

  const [archive, checksums] = await Promise.all([
    fetchBuffer(`${RELEASE_BASE_URL}/${assetName}`),
    fetchText(`${RELEASE_BASE_URL}/checksums.txt`)
  ]);

  verifyChecksum(assetName, archive, checksums);

  const binary = extractBinaryFromTarGz(archive, BINARY_NAME);
  await fsp.mkdir(DEST_DIR, { recursive: true });
  await fsp.writeFile(DEST_PATH, binary, { mode: 0o755 });
  await makeExecutable(DEST_PATH);

  console.log(`wireproxy installed at ${DEST_PATH}`);
}

function getAssetName() {
  const assetPlatform = assetPlatformByNodePlatform[process.platform];
  const assetArch = assetArchByNodeArch[process.arch];

  if (!assetPlatform || !assetArch) return null;

  return `wireproxy_${assetPlatform}_${assetArch}.tar.gz`;
}

function fetchBuffer(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "dappnode-electron-wireproxy-installer"
        }
      },
      (response) => {
        if (isRedirect(response.statusCode) && response.headers.location) {
          response.resume();
          if (redirectCount > 5) {
            reject(new Error(`Too many redirects downloading ${url}`));
            return;
          }

          resolve(fetchBuffer(new URL(response.headers.location, url).toString(), redirectCount + 1));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed for ${url}: HTTP ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );

    request.on("error", reject);
  });
}

async function fetchText(url) {
  return (await fetchBuffer(url)).toString("utf8");
}

function isRedirect(statusCode) {
  return statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308;
}

function verifyChecksum(assetName, archive, checksums) {
  const checksumLine = checksums
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.endsWith(`  ${assetName}`));

  if (!checksumLine) throw new Error(`Checksum not found for ${assetName}`);

  const expectedChecksum = checksumLine.split(/\s+/)[0];
  const actualChecksum = crypto.createHash("sha256").update(archive).digest("hex");

  if (actualChecksum !== expectedChecksum) {
    throw new Error(`Checksum mismatch for ${assetName}`);
  }
}

function extractBinaryFromTarGz(archive, binaryName) {
  const tar = zlib.gunzipSync(archive);

  for (let offset = 0; offset + 512 <= tar.length; ) {
    const name = readTarString(tar, offset, 100);
    if (!name) break;

    const prefix = readTarString(tar, offset + 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const size = Number.parseInt(readTarString(tar, offset + 124, 12).trim() || "0", 8);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    const entryName = path.basename(fullName);

    if (entryName === binaryName || entryName === "wireproxy" || entryName === "wireproxy.exe") {
      return tar.subarray(dataStart, dataEnd);
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  throw new Error(`Could not find wireproxy binary in archive`);
}

function readTarString(buffer, offset, length) {
  const raw = buffer.subarray(offset, offset + length);
  const nullIndex = raw.indexOf(0);
  return raw.subarray(0, nullIndex === -1 ? raw.length : nullIndex).toString("utf8");
}

async function makeExecutable(filePath) {
  if (process.platform !== "win32") await fsp.chmod(filePath, 0o755);
}

function fail(message) {
  const text = `wireproxy install warning: ${message}`;

  if (STRICT) {
    console.error(text);
    process.exitCode = 1;
    return;
  }

  console.warn(`${text}\nContinuing without bundled tunnel helper; direct mode still works.`);
}
