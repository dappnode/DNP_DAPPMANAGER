import React from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";
import Ok from "components/Ok";

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

  // if UpNp is not available then cannot be knwown the status of the ports
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
              </tr>
            </thead>
            <tbody>
              {upnpInfo.data.portsToOpen.map(route => {
                return (
                  <tr>
                    <td>{route.protocol}</td>
                    <td>{route.portNumber}</td>
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

export default function UpNp() {
  const systemInfo = useApi.systemInfoGet();

  return (
    <>
      {systemInfo.data ? (
        systemInfo.data.publicIp !== systemInfo.data.internalIp ? (
          systemInfo.data.upnpAvailable ? (
            <>
              <Ok ok={true} msg={"DAppNode has detected UpNp as enabled"} />
              <PortsOpened localIp={systemInfo.data.internalIp} />
            </>
          ) : (
            <>
              <Ok ok={false} msg={"DAppNode has detected UpNp as disabled"} />
              <p>
                Enable UpNp or manually open the necessary ports in your router
                for your DAppNode Ip:{" "}
                <strong>{systemInfo.data.internalIp}</strong>
              </p>

              <p>If ports are opended, please ignore this warming</p>

              <PortsToOpen />
            </>
          )
        ) : (
          <Ok
            ok={true}
            msg={
              "DAppNode is running on a remote machine and does not require UpNp"
            }
          />
        )
      ) : systemInfo.error ? (
        <ErrorView error={systemInfo.error} />
      ) : (
        <Loading steps={["Loading system info"]} />
      )}
    </>
  );
}
