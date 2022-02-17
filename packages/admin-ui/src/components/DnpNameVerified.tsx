import React from "react";
import { GoVerified } from "react-icons/go";
import { prettyDnpName } from "utils/format";
import "./dnpNameVerified.scss";

export default function DnpNameVerified({
  dnpName,
  isVerified,
  big
}: {
  dnpName: string;
  isVerified: boolean;
  big?: boolean;
}) {
  return (
    <div className={`dnp-name-verified ${big ? "big" : ""}`}>
      <span className="name">{prettyDnpName(dnpName)}</span>
      <span className="verified-badge">{isVerified && <GoVerified />}</span>
    </div>
  );
}
