import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Ok from "components/Ok";
import SubTitle from "components/SubTitle";
import React, { useState } from "react";
import Button from "components/Button";
import Table from "react-bootstrap/Table";
import { withToast } from "components/toast/Toast";
import { ReqStatus } from "types";
import { useApi } from "api";
import { api } from "api";
import { prettyDnpName } from "utils/format";
import {
  ApiTablePortStatus,
  PortToOpen,
  UpnpTablePortStatus
} from "@dappnode/common";
import Switch from "components/Switch";

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

  if (!apiPortMatch) return <Ok unknown={true} msg="Not found" />;

  switch (apiPortMatch.status) {
    case "unknown":
      return <Ok unknown={true} msg="Unknown" />;
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

  if (!upnpPortMatch) return <Ok unknown={true} msg="Not found" />;

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

export function PortsStatusTable({
  isUpnpEnabled
}: {
  isUpnpEnabled: boolean;
}) {
  const [upnpReqStatus, setUpnpReqStatus] = useState<
    ReqStatus<UpnpTablePortStatus[]>
  >({});
  const [apiReqStatus, setApiReqStatus] = useState<
    ReqStatus<ApiTablePortStatus[]>
  >({});
  const [upnpOpenReqStatus, setUpnpOpenReqStatus] = useState<ReqStatus>({});

  const portsToOpen = useApi.portsToOpenGet();

  const natRenewalStatus = useApi.natRenewalIsEnabled();

  async function apiStatusGet() {
    if (portsToOpen.data)
      try {
        setApiReqStatus({ loading: true });
        const apiPorts = await api.portsApiStatusGet({
          portsToOpen: portsToOpen.data
        });
        setApiReqStatus({ result: apiPorts });
      } catch (e) {
        setApiReqStatus({ error: e });
      }
  }

  async function upnpStatusGet() {
    if (portsToOpen.data)
      try {
        setUpnpReqStatus({ loading: true });
        const upnpPorts = await api.portsUpnpStatusGet({
          portsToOpen: portsToOpen.data
        });
        setUpnpReqStatus({ result: upnpPorts });
      } catch (e) {
        setUpnpReqStatus({ error: e });
      }
  }

  async function onUpnpSwitchToggle(checked: boolean) {
    try {
      setUpnpOpenReqStatus({ loading: true });
      await withToast(
        () => api.natRenewalEnable({ enableNatRenewal: checked }),
        {
          message: "Refreshing UPnP port mapping..",
          onSuccess: "Successfully mapped ports using UPnP"
        }
      );
      setUpnpOpenReqStatus({ result: true });
      if (upnpReqStatus.result) await upnpStatusGet();
      if (apiReqStatus.result) await apiStatusGet();
    } catch (e) {
      setUpnpOpenReqStatus({ error: e });
      console.error("Error on natRenewalEnable", e);
    }
  }

  if (portsToOpen.data)
    return (
      <>
        <SubTitle>
          Ports table
          <Button
            variant={"dappnode"}
            className="float-right"
            onClick={apiStatusGet}
            style={{ margin: "auto 5px auto" }}
            disabled={apiReqStatus.loading === true}
          >
            API Scan
          </Button>
          {isUpnpEnabled ? (
            <Button
              variant={"dappnode"}
              className="float-right"
              onClick={upnpStatusGet}
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
              {apiReqStatus.error && (
                <ErrorView hideIcon red error={apiReqStatus.error} />
              )}
              {(upnpReqStatus.result || upnpReqStatus.loading) && (
                <th>Status (UPnP) **</th>
              )}
              {upnpReqStatus.error && (
                <ErrorView hideIcon red error={upnpReqStatus.error} />
              )}
            </tr>
          </thead>
          <tbody>
            {portsToOpen.data.map(port => (
              <tr>
                <td>{port.portNumber}</td>
                <td>{port.protocol}</td>
                <td>{prettyDnpName(port.dnpName)}</td>

                {apiReqStatus.result && (
                  <td>
                    <RenderApiStatus
                      apiScanResult={apiReqStatus.result}
                      portToOpen={port}
                    />
                  </td>
                )}
                {apiReqStatus.loading && (
                  <td>
                    <ScanningPort />
                  </td>
                )}

                {upnpReqStatus.result && (
                  <td>
                    <RenderUpnpStatus
                      upnpScanResult={upnpReqStatus.result}
                      portToOpen={port}
                    />
                  </td>
                )}
                {upnpReqStatus.loading && (
                  <td>
                    <ScanningPort />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>

        <hr />
        {apiReqStatus.result ? (
          <p>
            <br />
            <strong>Status API*: </strong>ports status according to API scan.
            Not valid for UDP ports.
          </p>
        ) : null}

        {upnpReqStatus.result ? (
          <p>
            <br />
            <strong>Status UPnP**: </strong>ports status according to UPnP scan.
            Only available if UPnP is enabled.
          </p>
        ) : null}

        {isUpnpEnabled && (
          <div>
            <Switch
              label="UPnP port mapping is enabled"
              id="upnp-switch"
              checked={natRenewalStatus.data === true}
              disabled={upnpOpenReqStatus.loading}
              onToggle={onUpnpSwitchToggle}
            />
          </div>
        )}
      </>
    );
  if (portsToOpen.error) return <ErrorView error={portsToOpen.error} />;
  if (portsToOpen.isValidating)
    return <Loading steps={["Loading ports table"]} />;
  return <ErrorView error={"No data available"} />;
}
