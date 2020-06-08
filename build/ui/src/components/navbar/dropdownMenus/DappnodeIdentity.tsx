import React from "react";
import { useSelector } from "react-redux";
import BaseDropdown from "./BaseDropdown";
import makeBlockie from "ethereum-blockies-base64";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { stringSplit, stringIncludes } from "utils/strings";

/**
 * Patch to fix the visual issue of the domain being too long.
 * With the <wbr> (word break opportunity) the domain will be shown as:
 *  12ab34ab12ab23ab
 *  .dyndns.dappnode.io
 * @param key
 * @param value
 */
function parseIdentityKeyValue(key: string, value = "") {
  if (stringIncludes(key, "domain")) {
    const [hex, rootDomain] = stringSplit(value, /\.(.+)/);
    return (
      <>
        {hex}
        <wbr />.{rootDomain}
      </>
    );
  } else {
    return value;
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
      <span className="dappnode-name svg-text mr-2">{name}</span>
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
        .map(([key, value]) => {
          return { title: parseIdentityKeyValue(key, value) };
        })}
      Icon={Icon}
      className={"dappnodeidentity"}
      placeholder="No identity available, click the report icon"
    />
  );
}
