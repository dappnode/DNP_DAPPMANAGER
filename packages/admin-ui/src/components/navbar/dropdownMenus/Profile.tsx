import React, { useState } from "react";
import { fetchLogout } from "api/auth";
import ErrorView from "components/ErrorView";
import { systemProfilePath } from "pages/system/data";
import { AiOutlineUser } from "react-icons/ai";
import { Link } from "react-router-dom";
import { ReqStatus } from "types";
import BaseDropdown from "./BaseDropdown";

export default function Profile() {
  return (
    <BaseDropdown
      name="Profile"
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
      await fetchLogout();
      setReqStatus({ result: true });
      window.location.reload();
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  return (
    <div onClick={onLogout}>
      <div>Sign out</div>
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </div>
  );
}
