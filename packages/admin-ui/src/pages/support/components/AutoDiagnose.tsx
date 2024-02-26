import React from "react";
import { useApi } from "api";
import { notEmpty } from "utils/typescript";
import { DiagnoseResult } from "../types";
import * as formatDiagnose from "../formaters/autoDiagnoseTexts";
// Components
import Card from "components/Card";
import Ok from "components/Ok";
import LinkDocs from "components/LinkDocs";

export default function AutoDiagnose() {
  const publicIpRes = useApi.ipPublicGet();
  const systemInfo = useApi.systemInfoGet();
  const hostStats = useApi.statsDiskGet();
  const dnpInstalled = useApi.packagesGet();
  const ipfsTest = useApi.ipfsTest();

  const diagnosesArray: DiagnoseResult[] = [
    formatDiagnose.ipfs(ipfsTest),
    formatDiagnose.internetConnection(publicIpRes, systemInfo),
    formatDiagnose.openPorts(systemInfo),
    formatDiagnose.noNatLoopback(systemInfo),
    formatDiagnose.diskSpace(hostStats),
    formatDiagnose.coreDnpsRunning(dnpInstalled)
  ].filter(notEmpty);

  return (
    <Card>
      {diagnosesArray.map(({ loading, ok, msg, solutions, link }, i) => (
        <div key={i}>
          <Ok {...{ msg, ok, loading }} />
          {!ok && !loading && solutions ? (
            <ul>
              {solutions.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
              {link && <LinkDocs href={link.linkUrl}>{link.linkMsg}</LinkDocs>}
            </ul>
          ) : null}
        </div>
      ))}
    </Card>
  );
}
