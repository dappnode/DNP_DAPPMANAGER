import React from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";

function TableLoading({ steps }: { steps: string[] }) {
  return <Loading steps={steps} />;
}

function TableError({ error }: { error: Error | string }) {
  return <ErrorView error={error} />;
}

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
                <th>DAppNode ip</th>
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
                      <td>{route.ip}</td>
                    </tr>
                  );
                })}{" "}
            </tbody>
          </Table>
        </>
      ) : upnpInfo.error ? (
        <TableError error={upnpInfo.error} />
      ) : (
        <TableLoading steps={["Loading opened ports"]} />
      )}
    </>
  );
}

function PortsToBeOpened() {
  const upnpInfo = useApi.getPortsStatus();

  return (
    <>
      {upnpInfo.data ? (
        <>
          <SubTitle>Port to be opened</SubTitle>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Router port</th>
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
        <TableError error={upnpInfo.error} />
      ) : (
        <TableLoading steps={["Loading ports to be opened"]} />
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
              <p>DAppNode has detected UpNp as enabled</p>
              <PortsOpened localIp={systemInfo.data.internalIp} />
            </>
          ) : (
            <>
              <p>DAppNode requires UpNp to be enabled</p>
              <PortsToBeOpened />
            </>
          )
        ) : (
          <>DAppNode is running in a remote machine and does not require UpNp</>
        )
      ) : systemInfo.error ? (
        <ErrorView error={systemInfo.error} />
      ) : (
        <Loading steps={["Loading system info"]} />
      )}
    </>
  );
}
