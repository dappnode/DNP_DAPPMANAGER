import React, { useState } from "react";
import { api, useApi } from "api";
import { ReqStatus } from "types";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { withToast } from "components/toast/Toast";
import { InputSecret } from "components/InputSecret";

export default function Notifications() {
  const telegramStatus = useApi.getTelegramStatus();

  const [reqStatusToken, setReqStatusToken] = useState<ReqStatus>({});
  const [reqStatusStatus, setReqStatusStatus] = useState<ReqStatus>({});
  const [token, setToken] = useState("");

  async function updateTelegramToken() {
    try {
      setReqStatusToken({ loading: true });
      await withToast(() => api.setTelegramToken({ telegramToken: token }), {
        message: `Setting telegram token...`,
        onSuccess: `Updated telegram token`
      });
      setReqStatusToken({ result: true });
      if (telegramStatus.data === false) {
        await updateTelegramStatus(true);
      }
      setToken("");
    } catch (e) {
      setReqStatusToken({ error: e });
      console.error("Error on setTelegramToken", e);
    }
  }

  async function updateTelegramStatus(newStatus: boolean) {
    try {
      setReqStatusStatus({ loading: true });
      await withToast(
        () => api.setTelegramStatus({ telegramStatus: newStatus }),
        {
          message: newStatus ? "Enabling telegram..." : "Disabling telegram...",
          onSuccess: newStatus ? "Telegram ON" : "Telegram OFF"
        }
      );
      telegramStatus.revalidate();
      setReqStatusStatus({ result: true });
    } catch (e) {
      setReqStatusStatus({ error: e });
      console.error("Error on setTelegramStatus", e);
    }
  }

  async function sendTestNotification() {
    try {
      await api.notificationsTest({
        notification: {
          id: "test-notification",
          type: "info",
          title: "Test notification",
          body: "This is a test notification manually triggered by the user"
        }
      });
    } catch (e) {
      console.error("Error on sendTestNotification", e);
    }
  }

  return (
    <Card spacing>
      <SubTitle>Telegram</SubTitle>
      <div>
        Receive important notifications directly to your telegram account. To
        get your own token from Telegram botfather follow{" "}
        <a href="https://core.telegram.org/bots#creating-a-new-bot">
          this guide
        </a>
      </div>
      <div>
        Available commands in to start your bot chat
        <ul>
          <li>
            <strong>/start</strong>: Send after starting a conversation
            (channel) with your bot. You subscribe to future notifications
          </li>
          <li>
            <strong>/help</strong>: Display all available commands
          </li>
        </ul>
      </div>

      <Form.Group>
        <Form.Label>Telegram token</Form.Label>
        <InputSecret
          placeholder="Telegram token"
          value={token}
          onValueChange={setToken}
          onEnterPress={updateTelegramToken}
          append={
            <Button
              type="submit"
              className="register-button"
              onClick={updateTelegramToken}
              variant="dappnode"
            >
              Submit
            </Button>
          }
        />
      </Form.Group>

      {telegramStatus.data !== undefined ? (
        <Form.Group>
          <div>
            <Form.Label>Telegram status</Form.Label>
          </div>
          <Switch
            checked={telegramStatus.data}
            label={telegramStatus.data === true ? "On" : "Off"}
            onToggle={updateTelegramStatus}
          ></Switch>
        </Form.Group>
      ) : telegramStatus.error ? (
        <Ok msg={"Error getting status"} style={{ margin: "auto" }} />
      ) : (
        <Ok
          msg={"Loading status..."}
          loading={true}
          style={{ margin: "auto" }}
        />
      )}
      {reqStatusToken.error && (
        <ErrorView error={reqStatusToken.error} hideIcon red />
      )}
      {reqStatusStatus.error && (
        <ErrorView error={reqStatusStatus.error} hideIcon red />
      )}

      <hr />

      <Button onClick={sendTestNotification}>Send test notification</Button>
    </Card>
  );
}
