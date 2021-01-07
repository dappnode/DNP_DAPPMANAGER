import { api, useApi } from "api";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useState } from "react";
import { InputForm } from "components/InputForm";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { withToastNoThrow } from "components/toast/Toast";

export default function Notifications() {
  const telegramStatus = useApi.getTelegramStatus();

  const [reqStatusToken, setReqStatusToken] = useState<ReqStatus>({});
  const [reqStatusStatus, setReqStatusStatus] = useState<ReqStatus>({});
  const [token, setToken] = useState("");

  async function updateTelegramToken() {
    try {
      setReqStatusToken({ loading: true });
      await withToastNoThrow(
        () => api.setTelegramToken({ telegramToken: token }),
        {
          message: `Setting telegram token...`,
          onSuccess: `Updated telegram token`
        }
      );
      setReqStatusToken({ result: true });
      setToken("");
    } catch (e) {
      setReqStatusToken({ error: e });
      console.error("Error on setTelegramToken", e);
    }
  }

  async function updateTelegramStatus(newStatus: boolean) {
    try {
      setReqStatusStatus({ loading: true });
      await withToastNoThrow(
        () => api.setTelegramStatus({ telegramStatus: newStatus }),
        {
          message: `Switching telegram status...`,
          onSuccess: `Switched telegram status`
        }
      );
      telegramStatus.revalidate();
      setReqStatusStatus({ result: true });
    } catch (e) {
      setReqStatusStatus({ error: e });
      console.error("Error on setTelegramStatus", e);
    }
  }
  return (
    <>
      <Card>
        <SubTitle>Telegram</SubTitle>
        <div>
          Receive important notifications directly to your telegram account. To
          get your own token follow{" "}
          <a href="https://core.telegram.org/bots#creating-a-new-bot">
            this guide
          </a>
        </div>
        <div>
          Available commands in bot chat
          <ul>
            <li>
              <strong>/help</strong>
            </li>
            <li>
              <strong>/unsubscribe</strong>
            </li>
          </ul>
        </div>
        <InputForm
          fields={[
            {
              label: "Telegram token",
              labelId: "Telegram token",
              name: "Telegram token",
              autoComplete: "Telegram token",
              autoFocus: true,
              value: token,
              secret: true,
              required: true,
              onValueChange: setToken
            }
          ]}
        >
          <Button
            type="submit"
            className="register-button"
            onClick={updateTelegramToken}
            variant="dappnode"
          >
            Submit
          </Button>
          <br />
          {telegramStatus.data !== undefined ? (
            <Switch
              checked={telegramStatus.data}
              label={telegramStatus.data === true ? "On" : "Off"}
              onToggle={updateTelegramStatus}
            ></Switch>
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
        </InputForm>{" "}
      </Card>
    </>
  );
}
