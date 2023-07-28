import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { api } from "api";
import { wifiDnpName, wifiEnvSSID, wifiEnvWPA_PASSPHRASE } from "params";
import { getWifiStatus } from "services/dappnodeStatus/selectors";
import {
  validateMinLength,
  validateDockerEnv,
  validateStrongPasswordAsDockerEnv,
  validatePasswordsMatch
} from "utils/validation";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { withToastNoThrow } from "components/toast/Toast";
import { InputForm } from "components/InputForm";

export default function ChangeWifiPassword() {
  const wifiStatus = useSelector(getWifiStatus);
  const prevSsid = wifiStatus?.ssid || "";

  const [ssid, setSsid] = useState(prevSsid);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  useEffect(() => {
    if (prevSsid) setSsid(prevSsid);
  }, [prevSsid]);

  const ssidError =
    validateDockerEnv(ssid, "SSID") || validateMinLength(ssid, "SSID");
  const passwordError = validateStrongPasswordAsDockerEnv(password);
  const password2Error = validatePasswordsMatch(password, password2);
  const isValid =
    ssid &&
    password &&
    password2 &&
    !ssidError &&
    !passwordError &&
    !password2Error;

  function onChangePassword() {
    const envs = {
      [wifiEnvSSID]: ssid,
      [wifiEnvWPA_PASSPHRASE]: password
    };
    if (isValid)
      withToastNoThrow(
        () =>
          api.packageSetEnvironment({
            dnpName: wifiDnpName,
            environmentByService: { [wifiDnpName]: envs }
          }),
        {
          message: "Changing WIFI credentials...",
          onSuccess: "Changed WIFI credentials"
        }
      );
  }

  return (
    <Card>
      <div>
        Please change the WIFI credentials. The current password is the factory
        insecure default. Changing it to a strong password will protect your
        DAppNode from external attackers.
      </div>

      <InputForm
        fields={[
          {
            label: "SSID",
            labelId: "ssid",
            name: "ssid",
            autoComplete: "ssid",
            value: ssid,
            onValueChange: setSsid,
            error: ssidError
          },
          {
            label: "New password",
            labelId: "new-password",
            name: "new-wifi-password",
            autoComplete: "new-password",
            secret: true,
            value: password,
            onValueChange: setPassword,
            error: passwordError
          },
          {
            label: "Confirm new password",
            labelId: "confirm-new-password",
            name: "new-wifi-password",
            autoComplete: "new-password",
            secret: true,
            value: password2,
            onValueChange: setPassword2,
            error: password2Error
          }
        ]}
      >
        <Button type="submit" disabled={!isValid} onClick={onChangePassword}>
          Change password
        </Button>
      </InputForm>
    </Card>
  );
}
