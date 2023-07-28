import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { wifiDnpName, wifiEnvSSID, wifiEnvWPA_PASSPHRASE } from "params";
import {
  validateMinLength,
  validateDockerEnv,
  validateStrongPasswordAsDockerEnv,
  validatePasswordsMatch
} from "utils/validation";
// Components
import Card from "components/Card";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";

import { withToast } from "components/toast/Toast";
import { InputForm } from "components/InputForm";

export default function WifiCredentials(): JSX.Element {
  const wifiCredentials = useApi.wifiCredentialsGet();

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  useEffect(() => {
    if (wifiCredentials.data?.ssid) setSsid(wifiCredentials.data.ssid);
    if (wifiCredentials.data?.password)
      setPassword(wifiCredentials.data.password);
  }, [wifiCredentials.data]);

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

  async function onChangeCredentials() {
    const envs = {
      [wifiEnvSSID]: ssid,
      [wifiEnvWPA_PASSPHRASE]: password
    };
    if (isValid)
      await withToast(
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
    <>
      {wifiCredentials.data ? (
        <>
          <Card spacing>
            <div>Change the WIFI credentials.</div>

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
              <Button
                type="submit"
                disabled={!isValid}
                onClick={() => onChangeCredentials()}
              >
                Change credentials
              </Button>
            </InputForm>
          </Card>{" "}
        </>
      ) : wifiCredentials.error ? (
        <ErrorView error={wifiCredentials.error} />
      ) : wifiCredentials.isValidating ? (
        <Loading steps={["Loading wifi credentials"]} />
      ) : null}
    </>
  );
}
