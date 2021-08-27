import Switch from "components/Switch";
import { confirm } from "components/ConfirmDialog";
import { RouteComponentProps } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { subPathPublic, rootPath } from "../data";

export function PublicSwitch({ location, history }: RouteComponentProps) {
  const [dappstorePublic, setDappstorePublic] = useState(
    location.pathname === "/installer/public" ? true : false
  );

  useEffect(() => {
    location.pathname === "/installer/public"
      ? setDappstorePublic(true)
      : setDappstorePublic(false);
  }, [location]);

  async function confirmPublicDappstore() {
    if (!dappstorePublic) {
      await new Promise<void>(resolve =>
        confirm({
          title: `Are you sure you want to see the public repository?`,
          text: `The public repository is open and permissionless and can contain malicious packages that can compromise the security of your DAppNode. ONLY use the public repo if you know what you are doing and ONLY install packages whose developer you trust.
        
  Nobody, DAppNode Association, DAppNodeDAO or anyone, will be held responsible for loss of funds, the compromising of the hardware or any other non intended consequences of installing a non-curated package.`,
          label: "Public DAppStore",
          buttons: [
            {
              variant: "dappnode",
              label: "Cancel",
              onClick: () => resolve
            },
            {
              variant: "danger",
              label: "I understand, take me to the public repo",
              onClick: () => {
                history.push(rootPath + subPathPublic);
                setDappstorePublic(true);
              }
            }
          ]
        })
      );
    } else {
      history.push(rootPath);
      setDappstorePublic(false);
    }
  }
  return (
    <div>
      <Switch
        checked={dappstorePublic}
        onToggle={confirmPublicDappstore}
        label={"Public repository"}
      />
    </div>
  );
}
