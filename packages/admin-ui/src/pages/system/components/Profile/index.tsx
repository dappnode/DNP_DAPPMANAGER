import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { ChangePassword } from "./ChangePassword";
import { Logout } from "./Logout";

export default function Profile() {
  return (
    <>
      <SubTitle>Change password</SubTitle>
      <Card spacing>
        <ChangePassword />
      </Card>

      <SubTitle>Logout</SubTitle>
      <Card spacing>
        <Logout />
      </Card>
    </>
  );
}
