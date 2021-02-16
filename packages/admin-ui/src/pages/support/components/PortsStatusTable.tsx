import { useApi, api } from "api";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Ok from "components/Ok";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { withToast } from "components/toast/Toast";
import React, { useState } from "react";
import { Table } from "react-bootstrap";
import { ReqStatus } from "types";
import { shortNameCapitalized } from "utils/format";

export function PortsStatusTable() {
  const [isApiScanEnabled, setIsApiScanEnabled] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  const upnpInfo = useApi.getPortsStatus({ isApiScanEnabled });

  const [reqStatusPortsStatus, setReqStatusPortsStatus] = useState<ReqStatus>(
    {}
  );

  async function updatePortsStatus() {
    try {
      setReqStatusPortsStatus({ loading: true });
      setIsApiScanEnabled(true);
      await withToast(() => api.getPortsStatus({ isApiScanEnabled }), {
        message: `Updating ports status`,
        onSuccess: `Updated ports status`,
        onError: `Error updating ports status`
      }).then(upnpInfo.revalidate);
      setIsApiScanEnabled(false);
      setReqStatusPortsStatus({ result: true });
    } catch (e) {
      setReqStatusPortsStatus({ error: e });
      console.error("Error on getPortsStatus", e);
    }
  }

  if (upnpInfo.error) return <ErrorView error={upnpInfo.error} />;
  if (upnpInfo.isValidating) return <Loading steps={["Loading ports table"]} />;
  if (!upnpInfo.data) return <ErrorView error={"No data available"} />;

  return (
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
            <th>Port</th>
            <th>Protocol</th>
            <th>Service</th>
            {advancedMode ? (
              <>
                <th>Status (API) *</th>
                <th>Status (UPnP) *</th>
              </>
            ) : (
              <th>Status</th>
            )}
          </tr>
        </thead>
        <tbody>
          {upnpInfo.data.map(port => {
            return (
              <tr>
                <td>{port.port}</td>
                <td>{port.protocol}</td>
                <td>{shortNameCapitalized(port.dnpName)}</td>
                {/* Advanced mode: both status api and upnp. Non-advanced: merged status UPnP and api*/}
                {advancedMode ? (
                  <>
                    <td>
                      {port.apiStatus.status === "open" ? (
                        <Ok ok={true} msg={"Open"} />
                      ) : port.apiStatus.status === "closed" ? (
                        <Ok ok={false} msg={"Closed"} />
                      ) : port.apiStatus.status === "error" ? (
                        <Ok
                          ok={false}
                          msg={`Error: ${port.apiStatus.message}`}
                        />
                      ) : port.apiStatus.status === "unknown" ? (
                        "Unknown"
                      ) : (
                        "Not fetched"
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
                  </>
                ) : (
                  <td>
                    {port.mergedStatus === "open" ? (
                      <Ok ok={true} msg={"Open"} />
                    ) : port.mergedStatus === "closed" ? (
                      <Ok ok={false} msg={"Closed"} />
                    ) : (
                      "Unknown"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Switch
        checked={advancedMode}
        onToggle={() => setAdvancedMode(!advancedMode)}
        label={"Advanced mode"}
        highlightOnHover={true}
      />
      <hr />
      {advancedMode ? (
        <p>
          <strong>Status (external service)**: </strong>sport status using an
          API scan service
          <br />
          <strong>Status (UPnP)**: </strong>port status using UPnP scan
        </p>
      ) : null}

      {reqStatusPortsStatus.error && (
        <ErrorView error={reqStatusPortsStatus.error} hideIcon red />
      )}
    </>
  );
}
