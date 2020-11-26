import React from "react";
import { FiWifiOff } from "react-icons/fi";
import { StandaloneContainer } from "./StandaloneContainer";

export const NonAdmin = () => (
  <StandaloneContainer TopIcon={FiWifiOff} title="Error">
    <div className="title">Snap! You are not an admin</div>
    <div className="text">
      This website is reserved for this DAppNode's admin. Your VPN profile must
      have admin priviledges.
    </div>
  </StandaloneContainer>
);
