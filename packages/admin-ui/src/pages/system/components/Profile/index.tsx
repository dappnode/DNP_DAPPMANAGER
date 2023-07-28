import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { ChangePassword } from "./ChangePassword";
import { SignOut } from "./SignOut";

export default function Profile() {
  return (
    <>
      <SubTitle>Change UI password</SubTitle>
      <Card>
        <div>
          This password is used to authorize admin access to this UI. It
          protects you from Cross Site Scripting (XSS) attacks, and un-wanted
          access from other users in the DAppNodeWIFI network.
        </div>

        <ChangePassword />
      </Card>

      <SubTitle>Sign out</SubTitle>
      <Card>
        <SignOut />
      </Card>
    </>
  );
}
