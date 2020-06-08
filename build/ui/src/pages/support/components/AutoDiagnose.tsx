import React from "react";
import useSWR from "swr";
import { useApi } from "api";
import { useSelector } from "react-redux";
import { checkIpfsConnection } from "../diagnoseFunctions/ipfs";
import { notEmpty } from "utils/typescript";
import { DiagnoseResult } from "../types";
import { getConnectionStatus } from "services/connectionStatus/selectors";
import * as formatDiagnose from "../formaters/autoDiagnoseTexts";
// Components
import Card from "components/Card";
import Ok from "components/Ok";

export default function AutoDiagnose() {
  const connectionStatus = useSelector(getConnectionStatus);
  const systemInfo = useApi.systemInfoGet();
  const hostStats = useApi.getStats();
  const dnpInstalled = useApi.listPackages();
  const ipfsConnection = useSWR(["ipfsConnection"], checkIpfsConnection);

  const isOpen = connectionStatus.isOpen;
  const diagnosesArray: DiagnoseResult[] = [
    formatDiagnose.connection(connectionStatus),
    formatDiagnose.ipfs(ipfsConnection),
    ...(isOpen
      ? [
          formatDiagnose.openPorts(systemInfo),
          formatDiagnose.noNatLoopback(systemInfo),
          formatDiagnose.diskSpace(hostStats),
          formatDiagnose.coreDnpsRunning(dnpInstalled)
        ]
      : [])
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
