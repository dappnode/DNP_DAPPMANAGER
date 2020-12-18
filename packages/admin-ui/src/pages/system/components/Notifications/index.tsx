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

  useEffect(() => {
    setToken(token);
  }, [token]);

  async function updateTelegramToken() {
    await api.setTelegramToken({ telegramToken: token });
    setToken("");
  }

  async function updateTelegramStatus() {
    if (telegramStatus.data !== undefined) {
      await api.setTelegramStatus({ telegramStatus: telegramStatus.data });
    }
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
          {telegramStatus.data !== undefined ? (
            <Switch
              checked={telegramStatus.data}
              onToggle={updateTelegramStatus}
            ></Switch>
          ) : null}
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
