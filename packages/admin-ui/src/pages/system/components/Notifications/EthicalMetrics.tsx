import React, { useEffect, useState } from "react";
import { api, useApi } from "api";
import { ReqStatus } from "types";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import Card from "components/Card";
import Switch from "components/Switch";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { withToast } from "components/toast/Toast";
import Input from "components/Input";

export default function EthicalMetrics() {
  const ethicalMetricsConfig = useApi.getEthicalMetricsConfig();
  const [mail, setMail] = useState("");
  const [mailError, setMailError] = useState(false);

  const [reqStatusEnable, setReqStatusEnable] = useState<ReqStatus>({});
  const [reqStatusDisable, setReqStatusDisable] = useState<ReqStatus>({});

  // effect and regex for email validation
  useEffect(() => {
    const regex = /\S+@\S+\.\S+/;
    if (regex.test(mail)) {
      setMailError(false);
    } else {
      setMailError(true);
    }
  }, [mail]);

  useEffect(() => {
    if (ethicalMetricsConfig.data?.mail) {
      setMail(ethicalMetricsConfig.data.mail);
    }
  }, [ethicalMetricsConfig.data]);

  async function enableEthicalMetricsSync() {
    try {
      setReqStatusEnable({ loading: true });
      await withToast(
        () => api.enableEthicalMetrics({ mail, tgChannelId: null, sync: true }),
        {
          message: `Enabling ethical metrics with email ${mail}...`,
          onSuccess: `Enabled ethical metrics`
        }
      );
      setReqStatusEnable({ result: true });
      ethicalMetricsConfig.revalidate();
    } catch (e) {
      setReqStatusEnable({ error: e });
      console.error("Error on enableEthicalMetrics", e);
    }
  }

  async function disableEthicalMetrics() {
    try {
      setReqStatusDisable({ loading: true });
      await withToast(() => api.disableEthicalMetrics(), {
        message: `Disabling ethical metrics...`,
        onSuccess: `Disabled ethical metrics`
      });
      setReqStatusDisable({ result: true });
      ethicalMetricsConfig.revalidate();
    } catch (e) {
      setReqStatusDisable({ error: e });
      console.error("Error on registerEthicalMetrics", e);
    }
  }

  return (
    <Card spacing>
      <div>
        Receive notifications about the status of your dappnode directly into
        your email. Telemetry is tracked anonymously and no personal data is
        collected.
      </div>
      <div>
        The notifications you will receive are:
        <ul>
          <li>
            <strong>Dappnode down</strong>: You will receive a notification if
            your dappnode is down for more than 30 minutes.
          </li>
          <li>
            <strong>CPU over 80%</strong>: You will receive a notification if
            your CPU is over 80% for more than 30 minutes.
          </li>
          <li>
            <strong>CPU over 90%</strong>: You will receive a notification if
            your CPU is over 90% for more than 30 minutes.
          </li>
        </ul>
      </div>

      {ethicalMetricsConfig.data ? (
        <Form.Group>
          <Form.Label>Ethical metrics notifications email</Form.Label>
          <Input
            placeholder="Email"
            isInvalid={mailError}
            value={mail}
            onValueChange={setMail}
            append={
              <Button
                type="submit"
                className="register-button"
                onClick={enableEthicalMetricsSync}
                variant="dappnode"
                disabled={ethicalMetricsConfig.data.mail === mail}
              >
                Submit
              </Button>
            }
          />

          <br />

          <div>
            <Form.Label>Ethical metrics status</Form.Label>
          </div>

          {/** TODO: show instance and register status */}

          <Switch
            disabled={mailError}
            checked={ethicalMetricsConfig.data.enabled}
            label={ethicalMetricsConfig.data.enabled ? "On" : "Off"}
            onToggle={
              ethicalMetricsConfig.data.enabled
                ? disableEthicalMetrics
                : enableEthicalMetricsSync
            }
          ></Switch>
        </Form.Group>
      ) : ethicalMetricsConfig.error ? (
        <Ok msg={"Error getting status"} style={{ margin: "auto" }} />
      ) : (
        <Ok
          msg={"Loading status..."}
          loading={true}
          style={{ margin: "auto" }}
        />
      )}

      {reqStatusDisable.error && (
        <ErrorView error={reqStatusDisable.error} hideIcon red />
      )}
      {reqStatusEnable.error && (
        <ErrorView error={reqStatusEnable.error} hideIcon red />
      )}
    </Card>
  );
}
