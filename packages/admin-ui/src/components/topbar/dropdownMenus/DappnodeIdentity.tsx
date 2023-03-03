import React from "react";
import { useSelector } from "react-redux";
import BaseDropdown, { BaseDropdownMessage } from "./BaseDropdown";
import makeBlockie from "ethereum-blockies-base64";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { stringSplit } from "utils/strings";

type DappnodeIdentityType = ReturnType<typeof getDappnodeIdentityClean>;

function renderIdentityValue(
  key: keyof DappnodeIdentityType,
  value?: string
): JSX.Element | string | null {
  switch (key) {
    /**
     * Patch to fix the visual issue of the domain being too long.
     * With the <wbr> (word break opportunity) the domain will be shown as:
     *  12ab34ab12ab23ab
     *  .dyndns.dappnode.io
     */
    case "domain":
      const [hex, rootDomain] = stringSplit(value || "", /\.(.+)/);
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

export default function DappnodeIdentity() {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  if (!dappnodeIdentity || typeof dappnodeIdentity !== "object") {
    console.error("dappnodeIdentity must be an object");
    return null;
  }

  // Show a 24x24px blockie icon from the DAppNode's domain or ip+name
  const { name = "", ip = "", domain = "" } = dappnodeIdentity;
  const seed = stringSplit(domain, ".")[0] || `${name}${ip}`;

  const Icon = () => (
    <React.Fragment>
      {seed ? (
        <img src={makeBlockie(seed)} className="blockies-icon" alt="icon" />
      ) : (
        "?"
      )}
    </React.Fragment>
  );

  return (
    <BaseDropdown
      name="DAppNode Identity"
      messages={Object.entries(dappnodeIdentity)
        .filter(([_, value]) => value)
        .map(
          ([key, value]): BaseDropdownMessage => ({
            title: renderIdentityValue(
              key as keyof typeof dappnodeIdentity,
              value
            )
          })
        )}
      Icon={Icon}
      className={"dappnodeidentity"}
      placeholder="No identity available, click the report icon"
    />
  );
}
