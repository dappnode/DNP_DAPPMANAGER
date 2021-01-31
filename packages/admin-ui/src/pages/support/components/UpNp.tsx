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
                .filter(route => route.ip === localIp) // Check only map routing for the dappnode
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
                              route2.portNumber.toString() === route.inPort
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
              <PortsOpened localIp={systemInfo.data.internalIp} />
            </>
          )
        ) : (
          <Ok
            ok={false}
            msg={
              "DAppNode is running in a remote machine and does not require UpNp"
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
