import React, { useState } from "react";
import { useApi, api } from "api";
import { Table } from "react-bootstrap";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import SubTitle from "components/SubTitle";
import Button from "components/Button";
import Switch from "components/Switch";
import Ok from "components/Ok";
import Card from "components/Card";
import { ReqStatus } from "types";
import { withToast } from "components/toast/Toast";
import { shortNameCapitalized } from "utils/format";

function PortsStatusTable() {
  const upnpInfo = useApi.getPortsStatus();

  const [reqStatusPortsStatus, setReqStatusPortsStatus] = useState<ReqStatus>(
    {}
  );
  const [advancedMode, setAdvancedMode] = useState(false);

  async function updatePortsStatus() {
    try {
      setReqStatusPortsStatus({ loading: true });
      await withToast(() => api.getPortsStatus(), {
        message: `Updating ports status`,
        onSuccess: `Updated ports status`,
        onError: `Error updating ports status`
      }).then(upnpInfo.revalidate);
      setReqStatusPortsStatus({ result: true });
    } catch (e) {
      setReqStatusPortsStatus({ error: e });
      console.error("Error on getPortsStatus", e);
    }
  }

  return (
    <>
      {upnpInfo.data ? (
        <>
          <SubTitle>
            Ports table
            <Button
              variant={"dappnode"}
              className="float-right"
              onClick={async () => await updatePortsStatus()}
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
                {advancedMode ? (
                  <>
                    <th>Status API *</th>
                    <th>Status UPnP *</th>
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
                    <td>{port.protocol}</td>
                    <td>{port.port}</td>
                    <td>{shortNameCapitalized(port.service)}</td>
                    {/* Advanced mode: both api and upnp. Non-advanced: api*/}
                    {advancedMode ? (
                      <>
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
                      </>
                    ) : (
                      <td>
                        {port.protocol === "UDP" ||
                        port.apiStatus === "unknown" ? (
                          port.upnpStatus === "open" ? (
                            <Ok ok={true} msg={"Open"} />
                          ) : port.upnpStatus === "closed" ? (
                            <Ok ok={false} msg={"Closed"} />
                          ) : (
                            "Unknown"
                          )
                        ) : port.apiStatus === "open" ? (
                          <Ok ok={true} msg={"Open"} />
                        ) : port.apiStatus === "closed" ? (
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
            label={
              advancedMode === true ? "Advanced mode On" : "Advanced mode Off"
            }
            highlightOnHover={true}
          />
          <hr />
          {advancedMode ? (
            <p>
              <strong>Status API*: </strong>sport status using an API scan
              service
              <br />
              <strong>Status UPnP*: </strong>port status using UPnP scan
            </p>
          ) : null}
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
              <hr />
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
              <br />
              <strong>UDP ports must be manually checked in the router</strong>

              <hr />

              <PortsStatusTable />
            </>
          )
        ) : (
          <>
            <Ok
              ok={true}
              msg={
                "DAppNode is running on a remote machine and does not require UPnP"
              }
            />
            <PortsStatusTable />
          </>
        )
      ) : systemInfo.error ? (
        <ErrorView error={systemInfo.error} />
      ) : (
        <Loading steps={["Loading system info"]} />
      )}
    </Card>
  );
}
