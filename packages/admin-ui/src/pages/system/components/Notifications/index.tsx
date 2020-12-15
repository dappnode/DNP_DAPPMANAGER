import { api } from "api";
import Button from "components/Button";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import React, { useEffect, useState } from "react";
import { InputForm } from "../../../../components/InputForm";

export default async function Notifications() {
  const telegramStatus = await api.getTelegramStatus();
  const [token, setToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [botStatus, setBotStatus] = useState(telegramStatus);

  useEffect(() => {
    setBotStatus(botStatus);
  }, [botStatus]);

  useEffect(() => {
    setToken(token);
  }, [token]);

  useEffect(() => {
    setChannelId(channelId);
  }, [channelId]);

  function updateTelegramConfig() {
    api.setTelegramConfig({
      telegramToken: token,
      telegramStatus: botStatus,
      telegramChannelId: channelId
    });
  }

  return (
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
          },
          {
            label: "Telegram channelId (optional)",
            labelId: "Telegram channelId",
            name: "Telegram channelId",
            autoComplete: "Telegram channelId",
            autoFocus: true,
            value: channelId,
            secret: false,
            required: false,
            onValueChange: setChannelId
          }
        ]}
      >
        <Switch checked={botStatus} onToggle={setBotStatus}></Switch>
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
  );
}
