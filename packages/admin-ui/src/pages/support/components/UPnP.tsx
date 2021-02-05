import React from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";
import Ok from "components/Ok";
import Card from "components/Card";

function PortsTable() {
  const upnpInfo = useApi.getPortsStatus();

  return (
    <>
      {upnpInfo.data ? (
        <>
          <SubTitle>Ports table</SubTitle>
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
              {upnpInfo.data.portsData.map(port => {
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
        </>
      ) : upnpInfo.error ? (
        <ErrorView error={upnpInfo.error} />
      ) : (
        <Loading steps={["Loading opened ports"]} />
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
              <PortsTable />
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

              <PortsTable />
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
