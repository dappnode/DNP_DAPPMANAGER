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

  const [token, setToken] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

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
          {telegramStatus.data !== undefined ? (
            <Switch
              checked={telegramStatus.data}
              onToggle={updateTelegramStatus}
            ></Switch>
          ) : null}
          {reqStatus.error && (
            <ErrorView error={reqStatus.error} hideIcon red />
          )}
          <Button
            type="submit"
            className="register-button"
            onClick={updateTelegramToken}
            variant="dappnode"
          >
            Submit
          </Button>
        </InputForm>{" "}
      </Card>
    </>
  );
}
