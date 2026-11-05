import React from "react";
import { useNavigate } from "react-router-dom";
// Components
import Button from "components/Button";
// Modules
import { getInstallerPath } from "pages/installer";
// Utils
import { prettyDnpName } from "utils/format";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import "./noDnpInstalled.scss";

export const NoDnpInstalled = ({ id, customCopy }: { id: string; customCopy?: string }) => {
  const navigate = useNavigate();
  return (
    <Card className="install-pkg-card">
      <SubTitle>{`Install ${prettyDnpName(id)} package`}</SubTitle>
      {customCopy ? <p>{customCopy}</p> : <p>{prettyDnpName(id)} package not installed, click below to install it</p>}
      <Button variant="dappnode" onClick={() => navigate(getInstallerPath(id) + "/" + id)}>
        Install
      </Button>
    </Card>
  );
};
