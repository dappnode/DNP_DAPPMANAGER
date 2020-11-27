import React, { useEffect, useState } from "react";
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
import SystemInfo from "pages/system/components/SystemInfo";

export default function AutoDiagnose() {
  const realTimePublicIp = useApi.ipPublicGet();
  const connectionStatus = useSelector(getConnectionStatus);
  const systemInfo = useApi.systemInfoGet();
  const hostStats = useApi.statsDiskGet();
  const dnpInstalled = useApi.packagesGet();
  const ipfsConnection = useSWR(["ipfsConnection"], checkIpfsConnection);

  const isOpen = connectionStatus.isOpen;

  const [publicIpUpdated, setIp] = useState(realTimePublicIp.data);

  useEffect(() => {
    systemInfo.revalidate();
    if (!realTimePublicIp.data) {
      setIp("");
    } else {
      setIp(realTimePublicIp.data);
      if (systemInfo.data?.publicIp && publicIpUpdated) {
        systemInfo.data.publicIp = publicIpUpdated;
      }
    }
  }, [realTimePublicIp]);

  const diagnosesArray: DiagnoseResult[] = [
    formatDiagnose.connection(connectionStatus),
    formatDiagnose.ipfs(ipfsConnection),
    ...(isOpen
      ? [
          formatDiagnose.internetConnection(systemInfo),
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
