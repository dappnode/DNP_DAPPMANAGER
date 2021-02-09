import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { ChangePassword } from "./ChangePassword";
import { SignOut } from "./SignOut";
import { ChangeDappnodeWebName } from "./ChangeDappnodeWebName";

type ShowStatus = "loading" | "show" | "hide";

export default function Profile() {
  return (
    <>
      <SubTitle>Change DappNode Name</SubTitle>
      <Card spacing>
        <div>
        Dappnode name only affects to the User Interface. It's the name appears
        on the top navigation bar.
        </div>
        <ChangeDappnodeWebName />
      </Card>

      <SubTitle>Change UI password</SubTitle>
      <Card spacing>
        <div>
          This password is used to authorize admin access to this UI. It
          protects you from Cross Site Scripting (XSS) attacks, and un-wanted
          access from other users in the DAppNodeWIFI network.
        </div>

        <ChangePassword />
      </Card>

      <SubTitle>Sign out</SubTitle>
      <Card spacing>
        <SignOut />
      </Card>
    </>
  );
}
