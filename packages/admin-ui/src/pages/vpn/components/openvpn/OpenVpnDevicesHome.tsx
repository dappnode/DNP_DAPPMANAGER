import React, { useState } from "react";
import { api, useApi } from "api";
import { NavLink } from "react-router-dom";
// Own module
import { maxIdLength } from "../../data";
import coerceDeviceName from "../../helpers/coerceDeviceName";
// Components
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";
import Input from "components/Input";
import Card from "components/Card";
import Switch from "components/Switch";
import Button from "components/Button";
import { renderResponse } from "components/SwrRender";
import Alert from "react-bootstrap/esm/Alert";
// Icons
import { MdDelete, MdRefresh } from "react-icons/md";
import { MAIN_ADMIN_NAME } from "params";
// Params
import { vpnDnpName } from "params";
import { rootPath as installedRootPath } from "pages/installer";

export default function OpenVpnDevicesHome() {
  const [input, setInput] = useState("");
  const devicesReq = useApi.devicesList();
  const dnpsRequest = useApi.packagesGet();

  // Actions

  function addDevice(id: string) {
    withToastNoThrow(() => api.deviceAdd({ id }), {
      message: `Adding ${id}...`,
      onSuccess: `Added ${id}`
    }).then(devicesReq.revalidate);
  }

  function removeDevice(id: string) {
    confirm({
      title: `Removing ${id} device`,
      text: "The user using this device will lose access to this DAppNode ",
      label: "Remove",
      onClick: () =>
        withToastNoThrow(() => api.deviceRemove({ id }), {
          message: `Removing ${id}...`,
          onSuccess: `Removed ${id}`
        }).then(devicesReq.revalidate)
    });
  }

  function resetDevice(id: string) {
    const isMainAdmin = id === MAIN_ADMIN_NAME;
    confirm({
      title: isMainAdmin
        ? `WARNING! Reseting main admin`
        : `Reseting ${id} device`,
      text: isMainAdmin
        ? "You should only reset the credentials of the main admin if you suspect an unwanted party gained access to this credentials. If that is the case, reset the credentials, BUT download and install the new credentials IMMEDIATELY. Otherwise, you will lose access to your DAppNode when this connection stops"
        : "All profiles and links pointing to this device will no longer be valid",
      label: `Reset`,
      onClick: () =>
        withToastNoThrow(() => api.deviceReset({ id }), {
          message: `Reseting ${id}...`,
          onSuccess: `Reseted ${id}`
        }).then(devicesReq.revalidate)
    });
  }

  function toggleAdmin(id: string, isAdmin: boolean) {
    withToastNoThrow(() => api.deviceAdminToggle({ id, isAdmin }), {
      message: `${isAdmin ? "Making" : "Revoking"} ${id} admin...`,
      onSuccess: `${isAdmin ? "Made" : "Revoked"} ${id} admin`
    }).then(devicesReq.revalidate);
  }

  // Input errors
  const errors: string[] = [];
  if (input.length > maxIdLength)
    errors.push(`Device name must be shorter than {maxIdLength} characters`);

  // If the OpenVPN package (known as vpn) is not installed, invite the user to install it
  if (dnpsRequest.data) {
    const vpnDnp = dnpsRequest.data.find(dnp => dnp.dnpName === vpnDnpName);
    if (!vpnDnp) {
      const url = `${installedRootPath}/${vpnDnpName}`;
      return (
        <Alert variant="secondary">
          You must <NavLink to={url}>install the OpenVPN package</NavLink> to
          use this feature
        </Alert>
      );
    }
  }

  return (
    <>
      <Input
        placeholder="Device's unique name"
        value={input}
        // Ensure id contains only alphanumeric characters
        onValueChange={value => setInput(coerceDeviceName(value))}
        onEnterPress={() => {
          addDevice(input);
          setInput("");
        }}
        append={
          <Button
            variant="dappnode"
            onClick={() => addDevice(input)}
            disabled={errors.length > 0}
          >
            Add device
          </Button>
        }
      />

      {errors.map(error => (
        <div className="color-danger">{error}</div>
      ))}

      {renderResponse(devicesReq, ["Loading devices"], data => (
        <Card className="list-grid devices">
          <header>Name</header>
          <header className="center">Credentials</header>
          <header>Admin</header>
          <header>Reset</header>
          <header>Remove</header>
          {[...data]
            // Sort main admin device as first
            .sort(d1 => (d1.id === MAIN_ADMIN_NAME ? -1 : 0))
            .map(({ id, admin }) => (
              <React.Fragment key={id}>
                <div className="name">{id}</div>
                <NavLink to={id} className="no-a-style">
                  <Button className="get-link">Get</Button>
                </NavLink>

                <Switch
                  checked={admin}
                  onToggle={() => toggleAdmin(id, !admin)}
                />
                <MdRefresh
                  style={{ fontSize: "1.05rem" }}
                  onClick={() => resetDevice(id)}
                />
                <MdDelete
                  className={admin ? "disabled" : ""}
                  onClick={() => (admin ? null : removeDevice(id))}
                />
                <hr />
              </React.Fragment>
            ))}
        </Card>
      ))}
    </>
  );
}
