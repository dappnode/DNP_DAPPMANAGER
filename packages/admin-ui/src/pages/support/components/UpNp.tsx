import React from "react";
import { useApi } from "api";
import { Table } from "react-bootstrap";

export default function UpNp() {
  const upnpInfo = useApi.getPortsStatus();
  const localIpInfo = useApi.ipLocalGet();
  const publicIpInfo = useApi.ipPublicGet();

  const publicIp = publicIpInfo.data?.publicIp;
  const localIp = localIpInfo.data?.localIp;
  const isUpnpAvailable = upnpInfo.data?.upnpAvailable;
  const portsToOpen = upnpInfo.data?.portsToOpen;
  const upnpPortsMapping = upnpInfo.data?.upnpPortMappings;

  return (
    <>
      {typeof isUpnpAvailable !== undefined && publicIp && localIp ? (
        isUpnpAvailable === false && publicIp === localIp ? (
          <>
            <div className="title">Running remote DAppNode</div>
            <div className="description">
              Remotes DAppNodes do not require UpNp
            </div>
          </>
        ) : isUpnpAvailable === false && publicIp === localIp ? (
          <>
            <div className="title">Running local DAppNode</div>
            <div className="description">
              Local DAppNodes requires UpNp to be enabled
            </div>
          </>
        ) : (
          ""
        )
      ) : (
        ""
      )}
      {upnpPortsMapping && localIp ? (
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
            {upnpPortsMapping
              .filter(route => route.ip === localIp)
              .map(route => {
                return (
                  <tr>
                    <td>{route.protocol}</td>
                    <td>{route.exPort}</td>
                    <td>{route.inPort}</td>
                    <td>{route.ip}</td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      ) : (
        ""
      )}
      {portsToOpen ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Router port</th>
            </tr>
          </thead>
          <tbody>
            {portsToOpen.map(route => {
              return (
                <tr>
                  <td>{route.protocol}</td>
                  <td>{route.portNumber}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        ""
      )}
    </>
  );
}
