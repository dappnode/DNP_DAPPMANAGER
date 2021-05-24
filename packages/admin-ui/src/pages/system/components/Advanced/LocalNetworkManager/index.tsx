import React, { useState } from "react";
import { api } from "api";
import Card from "components/Card";
import Button from "components/Button";
import Input from "components/Input";
import Ok from "components/Ok";
import ErrorView from "components/ErrorView";
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";
import { ReqStatus } from "types";
import { HttpsLocalProxyingStatus } from "common";

export function LocalNetworkManager() {
  const [reqGetStatus, setReqGetStatus] = useState<
    ReqStatus<HttpsLocalProxyingStatus>
  >({});
  const [reqSetStatus, setReqSetStatus] = useState<
    ReqStatus<HttpsLocalProxyingStatus>
  >({});

  async function changeHttpsLocalProxying(status: HttpsLocalProxyingStatus) {
    if (status === "false") {
      await new Promise<void>(resolve =>
        confirm({
          title: `Disable local network discovery`,
          text: `Warning, you may loose local network access to your DAppNode (http://my.dappnode.local)`,
          label: `Disable`,
          onClick: resolve
        })
      );
    }

    try {
      setReqSetStatus({ loading: true });
      await withToastNoThrow(
        () => api.httpsLocalProxyingEnableDisable(status),
        {
          message: `${
            status === "true" ? "Enabling" : "Disabling"
          } Local network...`,
          onSuccess: `${
            status === "false" ? "Enabled" : "Disabled"
          } Local network...`
        }
      );
      setReqSetStatus({ result: status });
    } catch (e) {
      setReqSetStatus({ error: e });
      console.error("Error on httpsLocalProxyingEnableDisable", e);
    } finally {
      getHttpsLocalProxying();
    }
  }

  async function getHttpsLocalProxying() {
    try {
      setReqGetStatus({ loading: true });
      const status = await api.httpsLocalProxyingGet();
      setReqGetStatus({ result: status });
    } catch (e) {
      setReqGetStatus({ error: e });
      console.error("Error on httpsLocalProxyingGet", e);
    }
  }

  return (
    <Card spacing>
      <div className="subtle-header">
        ENABLE, DISABLE LOCAL NETWORK DISCOVERY
      </div>
      <p>Enable/disable local network discovery</p>

      <Input
        value={
          reqGetStatus.result === "true"
            ? "Enabled"
            : reqGetStatus.result === "false"
            ? "Disabled"
            : "?"
        }
        onValueChange={() => {}}
        prepend="Local Network discovery"
        append={
          <Button
            disabled={reqGetStatus.loading}
            onClick={getHttpsLocalProxying}
          >
            Fetch status
          </Button>
        }
      />

      {reqGetStatus.loading && (
        <Ok loading msg="Fetching Local Network status..."></Ok>
      )}
      {reqGetStatus.error && (
        <ErrorView error={reqGetStatus.error} hideIcon red />
      )}

      <div className="ssh-status-manager-buttons">
        <Button
          disabled={reqSetStatus.loading}
          onClick={() => changeHttpsLocalProxying("true")}
        >
          Enable
        </Button>
        <Button
          disabled={reqSetStatus.loading}
          onClick={() => changeHttpsLocalProxying("false")}
        >
          Disable
        </Button>
      </div>

      {reqSetStatus.loading && (
        <Ok loading msg="Changing Local Network status..."></Ok>
      )}
      {reqSetStatus.result && (
        <Ok ok msg={`Successfully ${reqSetStatus.result} Local Network`}></Ok>
      )}
      {reqSetStatus.error && (
        <ErrorView error={reqSetStatus.error} hideIcon red />
      )}
    </Card>
  );
}
