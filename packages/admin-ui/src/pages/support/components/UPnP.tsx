import React from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";
import Ok from "components/Ok";
import Card from "components/Card";

function PortsOpened({ localIp }: { localIp: string }) {
  const upnpInfo = useApi.getPortsStatus();

  return (
    <>
      {upnpInfo.data ? (
        <>
          <SubTitle>Opened ports</SubTitle>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Router port</th>
                <th>DAppNode port</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upnpInfo.data.upnpPortMappings
                .filter(route => route.ip === localIp) // Check only map routing for the dappnode IP
                .map(route => {
                  return (
                    <tr>
                      <td>{route.protocol}</td>
                      <td>{route.exPort}</td>
                      <td>{route.inPort}</td>
                      <td>
                        {upnpInfo.data ? (
                          upnpInfo.data.portsToOpen.some(
                            route2 =>
                              route2.portNumber.toString() === route.exPort // Will display if even having UPNP enabled the port is opened or still closed
                          ) ? (
                            <Ok ok={true} msg={"Open"} />
                          ) : (
                            <Ok ok={false} msg={"Closed"} />
                          )
                        ) : (
                          <Ok ok={false} msg={"Unknown"} />
                        )}
                      </td>
                    </tr>
                  );
                })}{" "}
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

function PortsToOpen() {
  const upnpInfo = useApi.getPortsStatus();
  const portsScanInfo = useApi.portsScanGet();

  return (
    <>
      {upnpInfo.data ? (
        <>
          <SubTitle>Ports to open</SubTitle>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Port number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upnpInfo.data.portsToOpen.map(route => {
                return (
                  <tr>
                    <td>{route.protocol}</td>
                    <td>{route.portNumber}</td>
                    <td>
                      {route.protocol === "UDP" ? (
                        "Unknown"
                      ) : portsScanInfo.data ? (
                        portsScanInfo.data.find(
                          port =>
                            port.tcpPort === route.portNumber &&
                            port.status === "open"
                        ) ? (
                          <Ok ok={true} msg={"Open"} />
                        ) : (
                          <Ok ok={false} msg={"Closed"} />
                        )
                      ) : portsScanInfo.error ? (
                        "Unknown"
                      ) : (
                        <Ok
                          msg={"Scanning..."}
                          loading={true}
                          style={{ margin: "auto" }}
                        />
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
        <Loading steps={["Loading ports to open"]} />
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
              <PortsOpened localIp={systemInfo.data.internalIp} />
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

              <PortsToOpen />
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
