import { api, useApi } from "api";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useEffect, useState } from "react";
import { InputForm } from "../../../../components/InputForm";

export default function Notifications() {
  const telegramStatus = useApi.getTelegramStatus();
  const [token, setToken] = useState("");
  const [botStatus, setBotStatus] = useState(
    telegramStatus.data !== undefined ? telegramStatus.data : false
  );

  useEffect(() => {
    setBotStatus(botStatus);
  }, [telegramStatus, botStatus]);

  useEffect(() => {
    setToken(token);
  }, [token]);

  async function updateTelegramConfig() {
    await api.setTelegramConfig({
      telegramToken: token,
      telegramStatus: botStatus
    });
  }

  return (
    <>
      <SubTitle>Telegram notifications</SubTitle>
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
          <Switch
            label="Status"
            checked={botStatus}
            onToggle={setBotStatus}
          ></Switch>
          <Button
            type="submit"
            className="register-button"
            onClick={updateTelegramConfig}
            variant="dappnode"
          >
            Submit
          </Button>
        </InputForm>{" "}
      </Card>
    </>
  );
}
