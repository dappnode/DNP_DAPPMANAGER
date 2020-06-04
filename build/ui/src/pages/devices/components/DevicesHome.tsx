import React, { useState } from "react";
import { api, useApi } from "api";
import { NavLink } from "react-router-dom";
// Own module
import { title, maxIdLength } from "../data";
import coerceDeviceName from "../helpers/coerceDeviceName";
// Components
import { confirm } from "components/ConfirmDialog";
import { withToastNoThrow } from "components/toast/Toast";
import Input from "components/Input";
import Button from "components/Button";
import Title from "components/Title";
import Card from "components/Card";
import Switch from "components/Switch";
import Loading from "components/Loading";
import ErrorView from "components/Error";
import { ButtonLight } from "components/Button";
// Icons
import { MdDelete, MdRefresh } from "react-icons/md";
import { superAdminId } from "params";

export default function DevicesHome() {
  const [input, setInput] = useState("");
  const devicesReq = useApi.devicesList();

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
    const isSuperAdmin = id === superAdminId;
    confirm({
      title: isSuperAdmin
        ? `WARNING! Reseting super admin`
        : `Reseting ${id} device`,
      text: isSuperAdmin
        ? "You should only reset the credentials of the super admin if you suspect an unwanted party gained access to this credentials. If that is the case, reset the credentials, BUT download and install the new credentials IMMEDIATELY. Otherwise, you will lose access to your DAppNode when this connection stops"
        : "All profiles and links pointing to this device will no longer be valid",
      label: `Reset`,
      onClick: () =>
        withToastNoThrow(() => api.deviceReset({ id }), {
          message: `Reseting ${id}...`,
          onSuccess: `Reseted ${id}`
        }).then(devicesReq.revalidate)
    });
  }

  function toggleAdmin(id: string) {
    withToastNoThrow(() => api.deviceAdminToggle({ id }), {
      message: `Toggling ${id} admin...`,
      onSuccess: `Toggled ${id} admin`
    }).then(devicesReq.revalidate);
  }

  // Input errors

  const errors: string[] = [];
  if (input.length > maxIdLength)
    errors.push(`Device name must be shorter than {maxIdLength} characters`);

  return (
    <>
      <Title title={title} />

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

      {devicesReq.data ? (
        <Card className="list-grid devices">
          <header>Name</header>
          <header className="center">Credentials</header>
          <header>Admin</header>
          <header>Reset</header>
          <header>Remove</header>
          {[...devicesReq.data]
            // Sort super admin device as first
            .sort(d1 => (d1.id === superAdminId ? -1 : 0))
            .map(({ id, admin }) => (
              <React.Fragment key={id}>
                <div className="name">{id}</div>
                <NavLink to={"/devices/" + id} className="no-a-style">
                  <ButtonLight className="get-link">Get</ButtonLight>
                </NavLink>

                <Switch checked={admin} onToggle={() => toggleAdmin(id)} />
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
      ) : devicesReq.isValidating ? (
        <Loading msg={"Loading devices..."} />
      ) : devicesReq.error ? (
        <ErrorView msg={`Error loading devices: ${devicesReq.error}`} />
      ) : null}
    </>
  );
}
