import React, { useState, useEffect } from "react";
import Alert from "react-bootstrap/Alert";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { ChangePassword } from "./ChangePassword";
import { SignOut } from "./SignOut";
import { fetchLoginStatus } from "api/auth";
import Ok from "components/Ok";

type ShowStatus = "loading" | "show" | "hide";

export default function Profile() {
  const [showChangePassword, setShowChangePassword] = useState<ShowStatus>(
    "loading"
  );

  useEffect(() => {
    async function fetchIsMainAdmin() {
      try {
        const res = await fetchLoginStatus();
        if (res.status !== "logged-in")
          throw Error(`Login status not logged-in`);
        if (res.isMainAdmin === false) {
          setShowChangePassword("hide");
        } else {
          // Fallback to show in case types change
          setShowChangePassword("show");
        }
      } catch (e) {
        console.warn(`Error on fetchIsMainAdmin: ${e.stack}`);
        setShowChangePassword("show");
      }
    }
    fetchIsMainAdmin();
  }, []);

  return (
    <>
      <SubTitle>Change UI password</SubTitle>
      <Card spacing>
        <div>
          This password is used to authorize admin access to this UI. It
          protects you from Cross Site Scripting (XSS) attacks, and un-wanted
          access from other users in the DAppNodeWIFI network.
        </div>

        {showChangePassword === "show" ? (
          <ChangePassword />
        ) : showChangePassword === "hide" ? (
          <Alert variant="warning">
            Only main admin can change its password
          </Alert>
        ) : showChangePassword === "loading" ? (
          <Ok loading msg="Loading admin status" />
        ) : null}
      </Card>

      <SubTitle>Sign out</SubTitle>
      <Card spacing>
        <SignOut />
      </Card>
    </>
  );
}
