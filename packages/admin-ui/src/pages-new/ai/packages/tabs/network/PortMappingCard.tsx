import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { PortMapping, PortProtocol } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Alert, AlertDescription } from "components/primitives/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { Globe, Plus, Trash2, TriangleAlert } from "lucide-react";
import { portsToId, getHostPortMappings, findDuplicates, getPortErrors } from "./utils";

export function PortMappingCard({
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
  const { errors, warnings } = getPortErrors(ports, dnpName, hostPortMapping);

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

  const duplicatedHost = findDuplicates(ports, "host");
  const duplicatedContainer = findDuplicates(ports, "container");
  const conflicting = ports.filter((p) => {
    const owner = hostPortMapping[`${p.host}/${p.protocol}`];
    return owner && owner !== dnpName;
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
        <div className="tw:rounded-lg tw:border tw:border-border tw:overflow-hidden">
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
