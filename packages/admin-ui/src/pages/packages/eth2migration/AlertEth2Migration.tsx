import { InstalledPackageDetailData } from "common";
import Button from "components/Button";
import React from "react";
import Alert from "react-bootstrap/esm/Alert";
import { prettyDnpName } from "utils/format";
import semver from "semver";
import { AlertPackageUpdateAvailable } from "../components/AlertPackageUpdateAvailable";
import {
  prysmLegacyStableVersion,
  prysmLegacyStableUpstreamVersion
} from "./params";

/**
 * Returns alert to do eth2migration if version is prysmLegacyStableVersion
 * Returns alert to update to prysmLegacyStableVersion if version is lower than prysmLegacyStableVersion
 */
export default function AlertEth2migration({
  dnp
}: {
  dnp: InstalledPackageDetailData;
}) {
  return (
    <>
      {semver.eq(dnp.version, prysmLegacyStableVersion) ? (
        <Alert variant="info" className="main-notification">
          <div>{prettyDnpName(dnp.dnpName)} update available to version </div>

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
}
