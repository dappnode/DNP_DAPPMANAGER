import React, { useState } from "react";
import { apiAuth } from "api";
import ErrorView from "components/ErrorView";
import { systemProfilePath } from "pages/system/data";
import { AiOutlineUser } from "react-icons/ai";
import { Link } from "react-router-dom";
import { ReqStatus } from "types";
import BaseDropdown from "./BaseDropdown";

export default function Profile({ username }: { username: string }) {
  return (
    <BaseDropdown
      name={`User: ${username || ""}`}
      messages={[
        { title: <Link to={systemProfilePath}>Change password</Link> },
        { title: <LogoutListItem /> }
      ]}
      Icon={AiOutlineUser}
      onClick={() => {}}
      className={"profile"}
    />
  );
}

function LogoutListItem() {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onLogout() {
    try {
      setReqStatus({ loading: true });
      await apiAuth.logoutAndReload();
      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  return (
    <div onClick={onLogout}>
      <div className="sign-out">Sign out</div>
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </div>
  );
}
