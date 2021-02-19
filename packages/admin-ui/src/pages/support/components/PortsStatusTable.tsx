import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Ok from "components/Ok";
import SubTitle from "components/SubTitle";
import React, { useState } from "react";
import Button from "components/Button";
import { ReqStatus } from "types";
import { useApi } from "api";
import { api } from "api";
import { Table } from "react-bootstrap";
import { shortNameCapitalized } from "utils/format";
import {
  ApiTablePortStatus,
  PortToOpen,
  UpnpTablePortStatus
} from "common/types";

export function PortsStatusTable({
  isUpnpEnabled
}: {
  isUpnpEnabled: boolean;
}) {
  const [upnpScanResult, setUpnpScanResult] = useState<UpnpTablePortStatus[]>();
  const [apiScanResult, setApiScanResult] = useState<ApiTablePortStatus[]>();
  const [upnpReqStatus, setUpnpReqStatus] = useState<ReqStatus>({});
  const [apiReqStatus, setApiReqStatus] = useState<ReqStatus>({});

  const portsToOpen = useApi.portsToOpenGet();

  async function apiButtonOnClick() {
    if (portsToOpen.data)
      try {
        setApiReqStatus({ loading: true });
        const apiPorts = await api.portsApiStatusGet({
          portsToOpen: portsToOpen.data
        });
        setApiReqStatus({ loading: false });
        setApiScanResult(apiPorts);
        setApiReqStatus({ result: true });
      } catch (e) {
        setApiReqStatus({ error: e });
      }
  }

  async function upnpButtonOnClick() {
    if (portsToOpen.data)
      try {
        setUpnpReqStatus({ loading: true });
        const upnpPorts = await api.portsUpnpStatusGet({
          portsToOpen: portsToOpen.data
        });
        setUpnpReqStatus({ loading: false });
        setUpnpScanResult(upnpPorts);
        setUpnpReqStatus({ result: true });
      } catch (e) {
        setUpnpReqStatus({ error: e });
      }
  }

  function RenderApiStatus({
    apiScanResult,
    portToOpen
  }: {
    apiScanResult: ApiTablePortStatus[];
    portToOpen: PortToOpen;
  }) {
    const apiPortMatch = apiScanResult.find(
      apiPort => apiPort.port === portToOpen.portNumber
    );

    if (!apiPortMatch) return <Ok msg="Not found" />;

    switch (apiPortMatch.status) {
      case "unknown":
        return <Ok msg="Unknown" />;
      case "open":
        return <Ok ok={true} msg="Open" />;
      case "closed":
        return <Ok ok={false} msg="Closed" />;
      case "error":
        return (
          <Ok
            ok={false}
            msg={"Error " + (apiPortMatch.message ? apiPortMatch.message : "")}
          />
        );
    }
  }

  function RenderUpnpStatus({
    upnpScanResult,
    portToOpen
  }: {
    upnpScanResult: UpnpTablePortStatus[];
    portToOpen: PortToOpen;
  }) {
    const upnpPortMatch = upnpScanResult.find(
      upnpPort => upnpPort.port === portToOpen.portNumber
    );

    if (!upnpPortMatch) return <Ok msg="Unknown" />;

    switch (upnpPortMatch.status) {
      case "open":
        return <Ok ok={true} msg="Open" />;
      case "closed":
        return <Ok ok={false} msg="Closed" />;
    }
  }

  function ScanningPort() {
    return <Ok loading={true} msg="Scanning" />;
  }

  if (portsToOpen.data)
    return (
      <SubTitle>
        <SubTitle>
          Ports table
          <Button
            variant={"dappnode"}
            className="float-right"
            onClick={apiButtonOnClick}
            style={{ margin: "auto 5px auto" }}
            disabled={apiReqStatus.loading === true}
          >
            API Scan
          </Button>
          {isUpnpEnabled ? (
            <Button
              variant={"dappnode"}
              className="float-right"
              onClick={upnpButtonOnClick}
              style={{ margin: "auto 5px auto" }}
              disabled={upnpReqStatus.loading === true}
            >
              UPnP Scan
            </Button>
          ) : null}
        </SubTitle>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Port</th>
              <th>Protocol</th>
              <th>Service</th>
              {(apiReqStatus.result || apiReqStatus.loading) && (
                <th>Status (API) *</th>
              )}
              {apiReqStatus.error && <ErrorView error={apiReqStatus.error} />}
              {(upnpReqStatus.result || upnpReqStatus.loading) && (
                <th>Status (UPnP) **</th>
              )}
              {upnpReqStatus.error && <ErrorView error={upnpReqStatus.error} />}

              {apiReqStatus.result && upnpReqStatus.result && (
                <th>Status merged ***</th>
              )}
            </tr>
          </thead>
          <tbody>
            {portsToOpen.data.map(port => {
              return (
                <tr>
                  <td>{port.portNumber}</td>
                  <td>{port.protocol}</td>
                  <td>{shortNameCapitalized(port.dnpName)}</td>

                  {apiReqStatus.result && apiScanResult && (
                    <td>
                      <RenderApiStatus
                        apiScanResult={apiScanResult}
                        portToOpen={port}
                      />
                    </td>
                  )}
                  {apiReqStatus.loading && (
                    <td>
                      <ScanningPort />
                    </td>
                  )}

                  {upnpReqStatus.result && upnpScanResult && (
                    <td>
                      <RenderUpnpStatus
                        upnpScanResult={upnpScanResult}
                        portToOpen={port}
                      />
                    </td>
                  )}
                  {upnpReqStatus.loading && (
                    <td>
                      <ScanningPort />
                    </td>
                  )}

                  {upnpReqStatus.result &&
                    upnpScanResult &&
                    apiReqStatus.result &&
                    apiScanResult && (
                      <td>
                        <RenderApiStatus
                          apiScanResult={apiScanResult}
                          portToOpen={port}
                        />
                      </td>
                    )}
                </tr>
              );
            })}
          </tbody>
        </Table>

        <hr />
        {apiReqStatus.result ? (
          <p>
            <br />
            <strong>Status API*: </strong>ports status using an API scan
            service. Not valid for UDP ports.
          </p>
        ) : null}

        {upnpReqStatus.result ? (
          <p>
            <br />
            <strong>Status UPnP**: </strong>ports status using UPnP scan. Only
            available if UPnP is enabled.
          </p>
        ) : null}

        {upnpReqStatus.result && apiReqStatus.result ? (
          <p>
            <br />
            <strong>Status merged ***: </strong>status merged taking into
            account UPnP and API scans.
          </p>
        ) : null}
      </SubTitle>
    );
  if (portsToOpen.error) return <ErrorView error={portsToOpen.error} />;
  if (portsToOpen.isValidating)
    return <Loading steps={["Loading ports table"]} />;
  return <ErrorView error={"No data available"} />;
}
