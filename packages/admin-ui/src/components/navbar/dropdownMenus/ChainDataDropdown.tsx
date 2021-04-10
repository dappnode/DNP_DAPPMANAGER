import React from "react";
import BaseDropdown, { BaseDropdownMessage } from "./BaseDropdown";
import { prettyDnpName } from "utils/format";
import { FiBox } from "react-icons/fi";
import { useChainData } from "hooks/chainData";

export default function ChainDataDropdown() {
  const chainData = useChainData();

  return (
    <BaseDropdown
      name="Chain status"
      messages={chainData.map(
        ({
          dnpName,
          name,
          message,
          help,
          error,
          syncing,
          progress
        }): BaseDropdownMessage => ({
          title: name || prettyDnpName(dnpName),
          body: message,
          help: help,
          type: error ? "danger" : syncing ? "warning" : "success",
          progress: progress,
          showProgress: syncing
        })
      )}
      Icon={() => <FiBox size={"1.4em"} />}
      className="chainstatus"
      placeholder="No chains installed"
    />
  );
}
