import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { wifiDnpName, wifiEnvSSID, wifiEnvWPA_PASSPHRASE } from "params";
import {
  validateMinLength,
  validateDockerEnv,
  validateStrongPasswordAsDockerEnv,
  validatePasswordsMatch
} from "utils/validation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Skeleton } from "components/primitives/skeleton";

export function WifiCredentialsSection() {
  const wifiCredentials = useApi.wifiCredentialsGet();
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  useEffect(() => {
    if (wifiCredentials.data?.ssid) setSsid(wifiCredentials.data.ssid);
    if (wifiCredentials.data?.password) setPassword(wifiCredentials.data.password);
  }, [wifiCredentials.data]);

  const ssidError = ssid ? validateDockerEnv(ssid, "SSID") || validateMinLength(ssid, "SSID") : "";
  const passwordError = password ? validateStrongPasswordAsDockerEnv(password) : "";
  const password2Error = password2 ? validatePasswordsMatch(password, password2) : "";
  const isValid = ssid && password && password2 && !ssidError && !passwordError && !password2Error;

  async function onChangeCredentials() {
    if (!isValid) return;
    const envs = {
      [wifiEnvSSID]: ssid,
      [wifiEnvWPA_PASSPHRASE]: password
    };
    try {
      toast.loading("Changing Wi-Fi credentials...");
      await api.packageSetEnvironment({
        dnpName: wifiDnpName,
        environmentByService: { [wifiDnpName]: envs }
      });
      toast.success("Wi-Fi credentials changed");
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (wifiCredentials.isValidating && !wifiCredentials.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Wi-Fi Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="tw:h-32 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  if (wifiCredentials.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Wi-Fi Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tw:text-sm tw:text-destructive">{wifiCredentials.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Wi-Fi Credentials</CardTitle>
        <CardDescription>Change the SSID and password for your Dappnode Wi-Fi hotspot.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:space-y-2">
          <Label htmlFor="wifi-ssid">SSID</Label>
          <Input id="wifi-ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} aria-invalid={!!ssidError} />
          {ssidError && <p className="tw:text-xs tw:text-destructive">{ssidError}</p>}
        </div>
        <div className="tw:space-y-2">
          <Label htmlFor="wifi-password">New Password</Label>
          <Input
            id="wifi-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!passwordError}
          />
          {passwordError && <p className="tw:text-xs tw:text-destructive">{passwordError}</p>}
        </div>
        <div className="tw:space-y-2">
          <Label htmlFor="wifi-password2">Confirm Password</Label>
          <Input
            id="wifi-password2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            aria-invalid={!!password2Error}
          />
          {password2Error && <p className="tw:text-xs tw:text-destructive">{password2Error}</p>}
        </div>
        <Button disabled={!isValid} onClick={onChangeCredentials}>
          Change Credentials
        </Button>
      </CardContent>
    </Card>
  );
}
