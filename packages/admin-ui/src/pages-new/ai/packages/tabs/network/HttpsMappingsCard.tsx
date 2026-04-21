import React, { useState } from "react";
import { api, useApi } from "api";
import { useSelector } from "react-redux";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { toast } from "sonner";
import { HttpsPortalMapping } from "@dappnode/types";
import { prettyFullName } from "utils/format";
import { httpsPortalDnpName } from "params";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Switch } from "components/primitives/switch";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import { Globe, Plus, Trash2, ArrowRight } from "lucide-react";

export function HttpsMappingsCard({ dnpName, serviceName }: { dnpName: string; serviceName: string }) {
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [from, setFrom] = useState("");
  const [port, setPort] = useState("80");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  const mappings = useApi.httpsPortalMappingsGet();
  const dnpsRequest = useApi.packagesGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  // Check if HTTPS Portal is installed
  if (dnpsRequest.data) {
    const httpsPortal = dnpsRequest.data.find((d) => d.dnpName === httpsPortalDnpName);
    if (!httpsPortal) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>HTTPS Domain Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>HTTPS Portal not installed</AlertTitle>
              <AlertDescription>You must install the HTTPS Portal to use this feature.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  }

  if (!mappings.data) {
    if (mappings.error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>HTTPS Domain Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{mappings.error.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>HTTPS Domain Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tw:text-sm tw:text-muted-foreground">Loading mappings…</p>
        </CardContent>
      </Card>
    );
  }

  const serviceMappings = mappings.data.filter(
    (m) => showAll || (m.dnpName === dnpName && m.serviceName === serviceName)
  );

  async function doAddMapping() {
    if (submitting) return;

    const mapping: HttpsPortalMapping = {
      fromSubdomain: from,
      dnpName,
      serviceName,
      port: parseInt(port),
      auth: user && password ? { username: user, password } : undefined,
      external: true
    };

    try {
      setSubmitting(true);
      toast.loading("Adding HTTPS mapping…", { id: "https-add" });
      await api.httpsPortalMappingAdd({ mapping });
      toast.success("Added HTTPS mapping", { id: "https-add" });
      setFrom("");
      setEditing(false);
      mappings.revalidate();
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "https-add" });
    } finally {
      setSubmitting(false);
    }
  }

  async function doRemoveMapping(mapping: HttpsPortalMapping) {
    try {
      toast.loading("Removing mapping…", { id: "https-rm" });
      await api.httpsPortalMappingRemove({ mapping });
      toast.success("Removed mapping", { id: "https-rm" });
      mappings.revalidate();
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "https-rm" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <Globe className="tw:size-4" />
          HTTPS Domain Mapping
        </CardTitle>
        <CardDescription>
          Only expose pre-approved safe services. Custom mappings may introduce security risks.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {/* Mapping list */}
        {serviceMappings.length === 0 ? (
          <p className="tw:text-sm tw:text-muted-foreground">No mappings</p>
        ) : (
          <div className="tw:rounded-lg tw:border tw:border-border tw:overflow-hidden">
            <div className="tw:grid tw:grid-cols-[1fr_auto_1fr_auto_40px] tw:gap-2 tw:bg-muted/40 tw:px-3 tw:py-2 tw:text-xs tw:font-medium tw:text-muted-foreground">
              <span>Container</span>
              <span />
              <span>Subdomain</span>
              <span>Auth</span>
              <span />
            </div>
            {serviceMappings.map((m) => (
              <div
                key={m.fromSubdomain}
                className="tw:grid tw:grid-cols-[1fr_auto_1fr_auto_40px] tw:gap-2 tw:px-3 tw:py-2 tw:border-t tw:border-border tw:items-center tw:text-sm"
              >
                <span className="tw:truncate tw:font-mono tw:text-xs">
                  {prettyFullName(m)} : {m.port}
                </span>
                <ArrowRight className="tw:size-3 tw:text-muted-foreground" />
                <a
                  href={`https://${m.fromSubdomain}.${dappnodeIdentity.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:text-primary tw:hover:underline tw:text-xs tw:truncate"
                >
                  {m.fromSubdomain}.{dappnodeIdentity.domain}
                </a>
                <span className="tw:text-xs tw:text-muted-foreground">{m.auth ? m.auth.username : "–"}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="tw:size-7 tw:text-destructive">
                      <Trash2 className="tw:size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="tw-base">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove HTTPS mapping</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove the mapping for {m.fromSubdomain}.{dappnodeIdentity.domain}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => doRemoveMapping(m)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        {/* Add mapping form */}
        {editing && (
          <div className="tw:flex tw:flex-col tw:gap-3 tw:p-4 tw:rounded-lg tw:border tw:border-border tw:bg-muted/20">
            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label>Subdomain</Label>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="my-service" />
              </div>
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label>Port</Label>
                <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label>User (optional)</Label>
                <Input value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                <Label>Password (optional)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div className="tw:flex tw:gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={!from || submitting}>
                    Add mapping
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="tw-base">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Expose service to the internet</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to expose this service to the public internet? This may introduce security
                      risks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={doAddMapping}>Expose</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-2">
            <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
            <Label htmlFor="show-all" className="tw:text-sm tw:font-normal">
              Show all
            </Label>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Plus className="tw:size-3.5 tw:mr-1" /> New mapping
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
