import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { useSelector } from "react-redux";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { toast } from "sonner";
import { PackageContainer, PortMapping, PortProtocol, InstalledPackageData, HttpsPortalMapping } from "@dappnode/types";
import { prettyDnpName, prettyFullName } from "utils/format";
import { httpsPortalDnpName } from "params";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Badge } from "components/primitives/badge";
import { Switch } from "components/primitives/switch";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { ServiceSelector } from "../components/ServiceSelector";
import { Globe, Network as NetworkIcon, Plus, Trash2, ArrowRight, TriangleAlert } from "lucide-react";

/* ── Main component ─────────────────────────────────────────────────── */

export function NetworkTab({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map((c) => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const container = containers.find((c) => c.serviceName === serviceName);

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {/* Service selector */}
      {serviceNames.length > 1 && (
        <ServiceSelector serviceName={serviceName} setServiceName={setServiceName} containers={containers} />
      )}

      {/* Container IPs */}
      {container && <ContainerIpsCard container={container} />}

      {/* Port mapping */}
      {container && (
        <PortMappingCard dnpName={container.dnpName} serviceName={container.serviceName} ports={container.ports} />
      )}

      {/* HTTPS mappings */}
      {container && <HttpsMappingsCard dnpName={container.dnpName} serviceName={container.serviceName} />}
    </div>
  );
}

/* ── Container IPs ──────────────────────────────────────────────────── */

function ContainerIpsCard({ container }: { container: PackageContainer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <NetworkIcon className="tw:size-4" />
          Container IPs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!container.ip && !container.privateIp ? (
          <p className="tw:text-sm tw:text-muted-foreground">Container IPs not available</p>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-2 tw:text-sm">
            {container.ip && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Badge variant="outline" className="tw:text-xs">
                  Public
                </Badge>
                <span className="tw:font-mono tw:text-xs">{container.ip}</span>
              </div>
            )}
            {container.privateIp && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Badge variant="outline" className="tw:text-xs">
                  Private
                </Badge>
                <span className="tw:font-mono tw:text-xs">{container.privateIp}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Port mapping ───────────────────────────────────────────────────── */

const maxPortNumber = 65535;
const maxRegisteredPortNumber = 32768 - 1;
const wireguardPort = 51820;

function PortMappingCard({
  dnpName,
  serviceName,
  ports: portsFromDnp
}: {
  dnpName: string;
  serviceName: string;
  ports: PortMapping[];
}) {
  const [ports, setPorts] = useState<PortMapping[]>([]);
  const [updating, setUpdating] = useState(false);
  const dnpInstalled = useApi.packagesGet();

  useEffect(() => {
    setPorts(
      [...(portsFromDnp || [])]
        .filter(({ host }) => host)
        .sort((a, b) => {
          if (a.deletable && !b.deletable) return 1;
          if (!a.deletable && b.deletable) return -1;
          return a.container - b.container;
        })
    );
  }, [portsFromDnp]);

  const hostPortMapping = getHostPortMappings(dnpInstalled.data || []);

  async function handleUpdate() {
    setUpdating(true);
    try {
      toast.loading(`Updating port mappings…`, { id: "port-update" });
      await api.packageSetPortMappings({ dnpName, portMappingsByService: { [serviceName]: ports } });
      toast.success(`Updated port mappings`, { id: "port-update" });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "port-update" });
    }
    setUpdating(false);
  }

  function addPort() {
    setPorts((ps) => [...ps, { container: 8000, protocol: PortProtocol.TCP, deletable: true }]);
  }

  function editPort(i: number, data: Partial<PortMapping>) {
    setPorts((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...data } : p)));
  }

  function removePort(i: number) {
    setPorts((ps) => ps.filter((p, idx) => !(idx === i && p.deletable)));
  }

  // Validation
  const duplicatedHost = findDuplicates(ports, "host");
  const duplicatedContainer = findDuplicates(ports, "container");
  const conflicting = ports.filter((p) => {
    const owner = hostPortMapping[`${p.host}/${p.protocol}`];
    return owner && owner !== dnpName;
  });

  const errors: string[] = [];
  duplicatedHost.forEach((p) => errors.push(`Duplicated host port ${p.host}/${p.protocol}`));
  duplicatedContainer.forEach((p) => errors.push(`Duplicated container port ${p.container}/${p.protocol}`));
  conflicting.forEach((p) => {
    const owner = hostPortMapping[`${p.host}/${p.protocol}`];
    errors.push(`Port ${p.host}/${p.protocol} is used by ${prettyDnpName(owner)}`);
  });

  const warnings: string[] = [];
  ports.forEach((p) => {
    if (
      p.deletable &&
      p.host &&
      p.host > maxRegisteredPortNumber &&
      p.host <= maxPortNumber &&
      p.host !== wireguardPort
    )
      warnings.push(`Host port ${p.host}/${p.protocol} is in the ephemeral range`);
  });

  const arePortsTheSame = portsToId(portsFromDnp) === portsToId(ports);
  const hasInvalid = ports.some((p) => p.deletable && (!p.container || !p.protocol));
  const disableUpdate =
    hasInvalid ||
    duplicatedHost.length > 0 ||
    duplicatedContainer.length > 0 ||
    conflicting.length > 0 ||
    arePortsTheSame ||
    updating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <Globe className="tw:size-4" />
          Public Port Mapping
        </CardTitle>
        <CardDescription>Map container ports to host ports.</CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {/* Port table */}
        <div className="tw:rounded-lg tw:border tw:border-border tw:overflow-hidden">
          {/* Header */}
          <div className="tw:grid tw:grid-cols-[1fr_1fr_100px_40px] tw:gap-2 tw:bg-muted/40 tw:px-3 tw:py-2 tw:text-xs tw:font-medium tw:text-muted-foreground">
            <span>Host port</span>
            <span>Container port</span>
            <span>Protocol</span>
            <span />
          </div>

          {ports.length === 0 && (
            <div className="tw:px-3 tw:py-4 tw:text-sm tw:text-muted-foreground tw:text-center">No port mappings</div>
          )}

          {ports.map(({ host, container, protocol, deletable }, i) => (
            <div
              key={i}
              className="tw:grid tw:grid-cols-[1fr_1fr_100px_40px] tw:gap-2 tw:px-3 tw:py-2 tw:border-t tw:border-border tw:items-center"
            >
              <Input
                type="number"
                placeholder="Ephemeral"
                value={host ?? ""}
                onChange={(e) => editPort(i, { host: parseInt(e.target.value) || undefined })}
                className="tw:h-7 tw:text-xs"
              />
              {deletable ? (
                <Input
                  type="number"
                  placeholder="Container port"
                  value={container}
                  onChange={(e) => editPort(i, { container: parseInt(e.target.value) || undefined })}
                  className="tw:h-7 tw:text-xs"
                />
              ) : (
                <Input value={container} readOnly className="tw:h-7 tw:text-xs tw:bg-muted/30" />
              )}
              {deletable ? (
                <Select
                  value={protocol}
                  onValueChange={(v: string) =>
                    editPort(i, { protocol: v === "UDP" ? PortProtocol.UDP : PortProtocol.TCP })
                  }
                >
                  <SelectTrigger className="tw:h-7 tw:text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="tw-base">
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={protocol} readOnly className="tw:h-7 tw:text-xs tw:bg-muted/30" />
              )}
              {deletable ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="tw:size-7 tw:text-destructive"
                  onClick={() => removePort(i)}
                >
                  <Trash2 className="tw:size-3" />
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>

        {/* Errors & warnings */}
        {errors.map((err) => (
          <Alert key={err} variant="destructive">
            <TriangleAlert className="tw:size-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ))}
        {warnings.map((w) => (
          <p key={w} className="tw:text-xs tw:text-amber-600 tw:dark:text-amber-400">
            ⚠ {w}
          </p>
        ))}

        {/* Actions */}
        <div className="tw:flex tw:gap-2">
          <Button onClick={handleUpdate} disabled={disableUpdate} size="sm">
            Update port mappings
          </Button>
          <Button variant="outline" onClick={addPort} size="sm">
            <Plus className="tw:size-3.5 tw:mr-1" /> New port
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── HTTPS mappings ─────────────────────────────────────────────────── */

function HttpsMappingsCard({ dnpName, serviceName }: { dnpName: string; serviceName: string }) {
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

  async function addMapping() {
    if (submitting) return;

    const mapping: HttpsPortalMapping = {
      fromSubdomain: from,
      dnpName,
      serviceName,
      port: parseInt(port),
      auth: user && password ? { username: user, password } : undefined,
      external: true
    };

    const confirmed = window.confirm("Are you sure you want to expose this service to the public internet?");
    if (!confirmed) return;

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

  async function removeMapping(mapping: HttpsPortalMapping) {
    const confirmed = window.confirm("Remove this HTTPS mapping?");
    if (!confirmed) return;

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="tw:size-7 tw:text-destructive"
                  onClick={() => removeMapping(m)}
                >
                  <Trash2 className="tw:size-3" />
                </Button>
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
              <Button size="sm" onClick={addMapping} disabled={!from || submitting}>
                Add mapping
              </Button>
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

/* ── Utilities ──────────────────────────────────────────────────────── */

function portsToId(portMappings: PortMapping[]): string {
  return portMappings.map(({ host, container, protocol }) => [host, container, protocol].join("")).join("");
}

function getHostPortMappings(dnps: InstalledPackageData[]) {
  const map: Record<string, string> = {};
  for (const dnp of dnps)
    for (const container of dnp.containers)
      for (const port of container.ports || []) if (port.host) map[`${port.host}/${port.protocol}`] = dnp.dnpName;
  return map;
}

function findDuplicates(ports: PortMapping[], field: "host" | "container"): PortMapping[] {
  const seen = new Set<string>();
  return ports.filter((p) => {
    const val = p[field];
    if (!val) return false;
    const key = `${val}-${p.protocol}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}
