import React from "react";
import SubTitle from "components/SubTitle";
import { TelegramNotifications } from "./Telegram";

export function Notifications() {
  return (
    <>
      <SubTitle>Telegram</SubTitle>
      <TelegramNotifications />
    </>
  );
}
