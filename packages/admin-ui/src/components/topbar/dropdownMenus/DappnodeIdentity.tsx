import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AiOutlineUser } from "react-icons/ai";
import BaseDropdown, { BaseDropdownMessage } from "./BaseDropdown";
import makeBlockie from "ethereum-blockies-base64";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { stringSplit } from "utils/strings";
import { apiAuth } from "api";
import ErrorView from "components/ErrorView";
import { systemProfilePath } from "pages/system/data";
import { ReqStatus } from "types";

type DappnodeIdentityType = ReturnType<typeof getDappnodeIdentityClean>;

function renderIdentityValue(key: keyof DappnodeIdentityType, value?: string): JSX.Element | string | null {
  const [hex, rootDomain] = stringSplit(value || "", /\.(.+)/);
  switch (key) {
    /**
     * Patch to fix the visual issue of the domain being too long.
     * With the <wbr> (word break opportunity) the domain will be shown as:
     *  12ab34ab12ab23ab
     *  .dyndns.dappnode.io
     */
    case "domain":
      return (
        <>
          {hex}
          <wbr />.{rootDomain}
        </>
      );

    case "name":
      return value ?? null;

    case "ip":
      return `${value} (public IP)`;

    case "internalIp":
      return `${value} (internal IP)`;
  }
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

export default function DappnodeIdentity({ username }: { username: string }) {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  if (!dappnodeIdentity || typeof dappnodeIdentity !== "object") {
    console.error("dappnodeIdentity must be an object");
    return null;
  }

  // Show a 24x24px blockie icon from the DAppNode's domain or ip+name
  const { name = "", ip = "", domain = "" } = dappnodeIdentity;
  const seed = stringSplit(domain, ".")[0] || `${name}${ip}`;

  const Icon = () => (
    <>
      {seed ? <img src={makeBlockie(seed)} className="blockies-icon" alt="icon" /> : <AiOutlineUser className="user-icon" />}
    </>

  );

  const identityMessages = Object.entries(dappnodeIdentity)
    .filter(([_, value]) => value)
    .map(
      ([key, value]): BaseDropdownMessage => ({
        title: renderIdentityValue(key as keyof typeof dappnodeIdentity, value)
      })
    );

  const profileMessages: BaseDropdownMessage[] = [
    { title: <Link to={systemProfilePath}>Change password</Link> },
    { title: <LogoutListItem /> }
  ];

  return (
    <BaseDropdown
      name={`DAppNode Identity - ${username || "User"}`}
      messages={[...identityMessages, ...profileMessages]}
      Icon={Icon}
      className={"dappnodeidentity"}
      placeholder="No identity available, click the report icon"
    />
  );
}
