import { api, useApi } from "api";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useState } from "react";
import { InputForm } from "components/InputForm";
import { ReqStatus } from "types";
import ErrorView from "components/ErrorView";

export default function Notifications() {
  const telegramStatus = useApi.getTelegramStatus();

  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const [token, setToken] = useState("");

  async function updateTelegramToken() {
    try {
      setReqStatus({ loading: true });
      await api.setTelegramToken({ telegramToken: token });
      setReqStatus({ result: true });
      setToken("");
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on setTelegramToken", e);
    }
  }

  async function updateTelegramStatus(newStatus: boolean) {
    try {
      setReqStatus({ loading: true });
      await api.setTelegramStatus({ telegramStatus: newStatus });
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on setTelegramStatus", e);
    }
  }
  return (
    <>
      <Card>
        <SubTitle>Telegram</SubTitle>
        <div>
          {/* COnsider using BIG BUTTON || STUDY HOOOOKS! */}
          Receive important notifications directly to your telegram account. To
          get your own token follow{" "}
          <a href="https://core.telegram.org/bots#creating-a-new-bot">
            this guide
          </a>
        </div>
        <div>
          <strong>Commands</strong>
          <p>/channel</p>
          <p>/channelremove</p>
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
          {telegramStatus.data !== undefined ? (
            <Switch
              checked={telegramStatus.data}
              onToggle={updateTelegramStatus}
            ></Switch>
          ) : null}
          {reqStatus.error && (
            <ErrorView error={reqStatus.error} hideIcon red />
          )}
        </InputForm>{" "}
      </Card>
    </>
  );
}
