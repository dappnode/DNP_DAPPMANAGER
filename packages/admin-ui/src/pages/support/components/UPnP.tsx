import React, { useState, useEffect } from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";
import Button from "components/Button";
import Switch from "components/Switch";
import Ok from "components/Ok";
import Card from "components/Card";
import { ReqStatus, PortsTable } from "types";
import { withToast } from "components/toast/Toast";

function PortsStatusTable() {
  const upnpInfo = useApi.getPortsStatus();

  const [reqStatusPortsStatus, setReqStatusPortsStatus] = useState<ReqStatus>(
    {}
  );
  const [portsStatus, setPortsStatus] = useState<PortsTable[]>([
    {} as PortsTable
  ]);
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    if (upnpInfo.data) setPortsStatus(upnpInfo.data.portsData);
  }, [upnpInfo.data]);

  async function updatePortsStatus() {
    try {
      setReqStatusPortsStatus({ loading: true });
      await withToast(async () => useApi.getPortsStatus(), {
        message: `Updating ports status`,
        onSuccess: `Updated ports status`,
        onError: `Error updating ports status`
      });
      setReqStatusPortsStatus({ result: true });
      if (upnpInfo.data) setPortsStatus(upnpInfo.data.portsData);
    } catch (e) {
      setReqStatusPortsStatus({ error: e });
      console.error("Error on getPortsStatus", e);
    }
  }

  return (
    <>
      {portsStatus ? (
        <>
          <SubTitle>
            Ports table
            <Button
              variant={"dappnode"}
              className="float-right"
              onClick={updatePortsStatus}
            >
              Scan ports
            </Button>
          </SubTitle>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Port</th>
                <th>Service</th>
                <th>Status API</th>
                <th>Status UPnP</th>
              </tr>
            </thead>
            <tbody>
              {portsStatus.map(port => {
                return (
                  <tr>
                    <td>{port.protocol}</td>
                    <td>{port.port}</td>
                    <td>{port.service}</td>
                    <td>
                      {port.apiStatus === "open" ? (
                        <Ok ok={true} msg={"Open"} />
                      ) : port.apiStatus === "closed" ? (
                        <Ok ok={false} msg={"Closed"} />
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td>
                      {port.upnpStatus === "open" ? (
                        <Ok ok={true} msg={"Open"} />
                      ) : port.upnpStatus === "closed" ? (
                        <Ok ok={false} msg={"Closed"} />
                      ) : (
                        "Unknown"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Switch
            checked={advancedMode}
            onToggle={() => setAdvancedMode(!advancedMode)}
            label={
              advancedMode === true ? "Advanced mode On" : "Advanced mode Off"
            }
            highlightOnHover={true}
          />
        </>
      ) : upnpInfo.error ? (
        <ErrorView error={upnpInfo.error} />
      ) : (
        <Loading steps={["Loading ports table"]} />
      )}
      {reqStatusPortsStatus.error && (
        <ErrorView error={reqStatusPortsStatus.error} hideIcon red />
      )}
    </>
  );
}

export default function UPnP() {
  const systemInfo = useApi.systemInfoGet();

  return (
    <Card>
      {systemInfo.data ? (
        systemInfo.data.publicIp !== systemInfo.data.internalIp ? (
          systemInfo.data.upnpAvailable ? (
            <>
              <Ok ok={true} msg={"DAppNode has detected UPnP as enabled"} />
              <PortsStatusTable />
            </>
          ) : (
            <>
              <Ok ok={false} msg={"DAppNode has detected UPnP as disabled"} />
              <p>
                Enable UPnP or manually open and associate the necessary ports
                in the router to the DAppNode local Ip:
                <strong>{systemInfo.data.internalIp}</strong>
              </p>

              <strong>UDP ports must be manually checked in the router</strong>

              <PortsStatusTable />
            </>
          )
        ) : (
          <Ok
            ok={true}
            msg={
              "DAppNode is running on a remote machine and does not require UPnP"
            }
          />
        )
      ) : systemInfo.error ? (
        <ErrorView error={systemInfo.error} />
      ) : (
        <Loading steps={["Loading system info"]} />
      )}
    </Card>
  );
}
