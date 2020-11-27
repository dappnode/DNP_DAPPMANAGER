import React from "react";
import useSWR from "swr";
import { useApi } from "api";
import { checkIpfsConnection } from "../diagnoseFunctions/ipfs";
import { notEmpty } from "utils/typescript";
import { DiagnoseResult } from "../types";
import * as formatDiagnose from "../formaters/autoDiagnoseTexts";
// Components
import Card from "components/Card";
import Ok from "components/Ok";

export default function AutoDiagnose() {
  const systemInfo = useApi.systemInfoGet();
  const hostStats = useApi.statsDiskGet();
  const dnpInstalled = useApi.packagesGet();
  const ipfsConnection = useSWR(["ipfsConnection"], checkIpfsConnection);

  const diagnosesArray: DiagnoseResult[] = [
    formatDiagnose.ipfs(ipfsConnection),
    formatDiagnose.internetConnection(systemInfo),
    formatDiagnose.openPorts(systemInfo),
    formatDiagnose.noNatLoopback(systemInfo),
    formatDiagnose.diskSpace(hostStats),
    formatDiagnose.coreDnpsRunning(dnpInstalled)
  ].filter(notEmpty);

  return (
    <Card>
      {diagnosesArray.map(({ loading, ok, msg, solutions }, i) => (
        <div key={i}>
          <Ok {...{ msg, ok, loading }} />
          {!ok && !loading && solutions ? (
            <ul>
              {solutions.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </Card>
  );
}
