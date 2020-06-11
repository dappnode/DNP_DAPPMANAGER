import React from "react";
import { GoVerified } from "react-icons/go";
import { shortNameCapitalized, isDnpVerified } from "utils/format";
import "./dnpNameVerified.scss";

export default function DnpNameVerified({
  name,
  origin,
  big
}: {
  name: string;
  origin?: string | null;
  big?: boolean;
}) {
  const isVerified = !origin && isDnpVerified(name);

  return (
    <div className={`dnp-name-verified ${big ? "big" : ""}`}>
      <span className="name">{shortNameCapitalized(name)}</span>
      <span className="verified-badge">{isVerified && <GoVerified />}</span>
    </div>
  );
}
