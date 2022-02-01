import { Eth2Client, Eth2Network, InstalledPackageDetailData } from "common";
import Button from "components/Button";
import React from "react";
import Alert from "react-bootstrap/esm/Alert";
import { prettyDnpName } from "utils/format";
import semver from "semver";
import { AlertPackageUpdateAvailable } from "../components/AlertPackageUpdateAvailable";
import {
  prysmLegacyStableVersion,
  prysmLegacyStableUpstreamVersion,
  prysmDnpName,
  prysmPraterDnpName,
  prysmPraterLegacyStableVersion
} from "./params";
import { Dropdown } from "react-bootstrap";
import { api } from "api";
import { withToast } from "components/toast/Toast";
import { confirm } from "components/ConfirmDialog";

/**
 * Returns alert to do eth2migration if version is prysmLegacyStableVersion
 * Returns alert to update to prysmLegacyStableVersion if version is lower than prysmLegacyStableVersion
 */
export default function AlertEth2migration({
  dnp
}: {
  dnp: InstalledPackageDetailData;
}) {
  async function migrateEth2({ client }: { client: Eth2Client }) {
    const network: Eth2Network = dnp.dnpName.includes("prater")
      ? "prater"
      : "mainnet";

    await new Promise<void>(resolve => {
      confirm({
        title: `Eth2 migrate`,
        text: `You are about to perform a migration from validating with Prysm not using web3signer to validating with ${client} using web3signer in the network ${network}.`,
        label: "Migrate",
        onClick: resolve
      });
    });

    await withToast(() => api.eth2Migrate({ client, network }), {
      message: `Eth2 migrating to ${client}`,
      onSuccess: `Eth2 migrated to ${client}`
    });
  }

  switch (dnp.dnpName) {
    case prysmDnpName:
      return (
        <>
          {semver.eq(dnp.version, prysmLegacyStableVersion) ? (
            <Alert variant="info" className="main-notification">
              {prettyDnpName(dnp.dnpName)} is in the stable version required to
              migrate to web3signer{" "}
              <Button variant="dappnode">Eth2 migration</Button>
            </Alert>
          ) : semver.lte(dnp.version, prysmLegacyStableVersion) ? (
            <AlertPackageUpdateAvailable
              dnpName={dnp.dnpName}
              updateAvailable={{
                newVersion: prysmLegacyStableVersion,
                upstreamVersion: prysmLegacyStableUpstreamVersion
              }}
            />
          ) : null}
        </>
      );
    case prysmPraterDnpName:
      return (
        <>
          {semver.eq(dnp.version, prysmPraterLegacyStableVersion) ? (
            <Alert variant="info" className="main-notification">
              {prettyDnpName(dnp.dnpName)} is in the stable version required to
              migrate to web3signer{" "}
              <Dropdown>
                <Dropdown.Toggle variant="dappnode" id="dropdown-basic">
                  Eth2 migrate
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => migrateEth2({ client: "teku" })}
                  >
                    Teku
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => migrateEth2({ client: "prysm" })}
                  >
                    Prysm
                  </Dropdown.Item>
                  <Dropdown.Item
                    onCLick={() => migrateEth2({ client: "lighthouse" })}
                  >
                    Lighthouse
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Alert>
          ) : semver.lte(dnp.version, prysmLegacyStableVersion) ? (
            <AlertPackageUpdateAvailable
              dnpName={dnp.dnpName}
              updateAvailable={{
                newVersion: prysmPraterLegacyStableVersion,
                upstreamVersion: prysmLegacyStableUpstreamVersion
              }}
            />
          ) : null}
        </>
      );
    default:
      return null;
  }
}
