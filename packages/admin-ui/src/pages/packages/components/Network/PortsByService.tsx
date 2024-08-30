import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { withToastNoThrow } from "components/toast/Toast";
// Components
import Button from "components/Button";
import Input from "components/Input";
import Select from "components/Select";
// Utils
import { prettyDnpName } from "utils/format";
import { MdAdd, MdClose } from "react-icons/md";
// Style
import "./network.scss";
import {
  InstalledPackageData,
  PortMapping,
  PortProtocol
} from "@dappnode/types";

const maxRegisteredPortNumber = 32768 - 1;
const maxPortNumber = 65535;

export function PortsByService({
  dnpName,
  serviceName,
  ports: portsFromDnp
}: {
  dnpName: string;
  serviceName: string;
  ports: PortMapping[];
}) {
  const [ports, setPorts] = useState<PortMapping[]>(portsFromDnp);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    // Shallow copy since sort mutates the original array
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

  // Fetch current list of packages to check which ports are already used
  const dnpInstalled = useApi.packagesGet();
  const hostPortMapping = getHostPortMappings(dnpInstalled.data || []);

  async function onUpdateEnvsSubmit() {
    setUpdating(true);
    await withToastNoThrow(
      () =>
        api.packageSetPortMappings({
          dnpName,
          portMappingsByService: { [serviceName]: ports }
        }),
      {
        message: `Updating ${prettyDnpName(dnpName)} port mappings...`,
        onSuccess: `Updated ${prettyDnpName(dnpName)} port mappings`
      }
    );
    setUpdating(false);
  }

  function addNewPort() {
    const newPort: PortMapping = {
      container: 8000,
      protocol: PortProtocol.TCP,
      deletable: true
    };
    setPorts(ps => [...ps, newPort]);
  }

  function editPort(i: number, data: Partial<PortMapping>) {
    setPorts(ps =>
      ps.map((p, _i): PortMapping => (i === _i ? { ...p, ...data } : p))
    );
  }

  function removePort(i: number) {
    setPorts(ps =>
      ps.filter(({ deletable }, _i) => {
        return _i !== i || !deletable;
      })
    );
  }

  function getDuplicatedContainerPorts(): PortMapping[] {
    const existingPorts = new Set<string>();
    return ports.filter(port => {
      if (port.container) {
        const key = `${port.container}-${port.protocol}`;
        if (existingPorts.has(key)) return true;
        else existingPorts.add(key);
      }
      return false;
    });
  }

  function getDuplicatedHostPorts(): PortMapping[] {
    const existingPorts = new Set<string>();
    return ports.filter(port => {
      if (port.host) {
        const key = `${port.host}-${port.protocol}`;
        if (existingPorts.has(key)) return true;
        else existingPorts.add(key);
      }
      return false;
    });
  }

  type ConflictingPort = PortMapping & { owner: string };
  function getConflictingPorts(): ConflictingPort[] {
    const conflictingPorts: ConflictingPort[] = [];
    for (const port of ports) {
      const owner = hostPortMapping[getHostPortId(port)];
      if (owner && owner !== dnpName) conflictingPorts.push({ ...port, owner });
    }
    return conflictingPorts;
  }

// Function to get any ports in the ephemeral range, excluding port 51820, which is the WireGuard port
function getPortsInEphemeralRange(): PortMapping[] {
  return ports.filter(
    ({ host, container, deletable }) =>
      deletable && (
        (container > maxRegisteredPortNumber && container <= maxPortNumber && container !== 51820) ||
        (host !== undefined && host > maxRegisteredPortNumber && host <= maxPortNumber && host !== 51820)
      )
  );
}

  // Function get any ports over the max allowed port number defined at "maxPortNumber"
  function getPortsOverTheMax(): PortMapping[] {
    return ports.filter(
      ({ host, container, deletable }) =>
        deletable && (
          container > maxPortNumber ||
          (host !== undefined && host > maxPortNumber)
        )
    );
  }

  const areNewMappingsInvalid = ports.some(
    ({ container, protocol, deletable }) =>
      deletable && (!container || !protocol)
  );
  const duplicatedContainerPorts = getDuplicatedContainerPorts();
  const duplicatedHostPorts = getDuplicatedHostPorts();
  const conflictingPorts = getConflictingPorts();
  const portsEphimeralRange = getPortsInEphemeralRange();
  const portsOverTheMax = getPortsOverTheMax();
  const arePortsTheSame = portsToId(portsFromDnp) === portsToId(ports);

  // Aggregate error & warning messages as an array of strings
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const duplicatedHostPort of duplicatedHostPorts)
    errors.push(
      `❌ Duplicated mapping for host port ${duplicatedHostPort.host}/${duplicatedHostPort.protocol}. Each host port can only be mapped once.`
    );

  for (const duplicatedContainerPort of duplicatedContainerPorts)
    errors.push(
      `❌ Duplicated mapping for package port ${duplicatedContainerPort.container}/${duplicatedContainerPort.protocol}. Each package port can only be mapped once.`
    );

  for (const conflictingPort of conflictingPorts) {
    const portName = `${conflictingPort.host}/${conflictingPort.protocol}`;
    const ownerName = prettyDnpName(conflictingPort.owner);
    errors.push(
      `❌ Port ${portName} is already mapped by the DAppNode Package ${ownerName}`
    );
  }

  // Push error if there are any ports (host or container) over the max allowed port number
  for (const portOverEphimeralMax of portsOverTheMax) {
    if (portOverEphimeralMax.host !== undefined) {
      errors.push(
        `❌ Port mapping ${portOverEphimeralMax.host}/${portOverEphimeralMax.protocol} exceeds the maximum allowed port number of ${maxPortNumber} and can't be used.`
      );
    }
    if (portOverEphimeralMax.container !== undefined) {
      errors.push(
        `❌ Port mapping ${portOverEphimeralMax.container}/${portOverEphimeralMax.protocol} exceeds the maximum allowed port number of ${maxPortNumber} and can't be used.`
      );
    }
  }

  // Push error if there are any ports (host or container) over the max allowed but lower than the max ephemeral port number
  for (const portEphimeralRange of portsEphimeralRange) {
    if (portEphimeralRange.host !== undefined && portEphimeralRange.host !== 51820) {
      warnings.push(
        `⚠️ Host Port mapping ${portEphimeralRange.host}/${portEphimeralRange.protocol} is in the ephemeral port range (${maxRegisteredPortNumber}-${maxPortNumber}).`
      );
    }
    if (portEphimeralRange.container !== undefined && portEphimeralRange.container !== 51820) {
      warnings.push(
        `⚠️ Package Port mapping ${portEphimeralRange.container}/${portEphimeralRange.protocol} is in the ephemeral port range (${maxRegisteredPortNumber}-${maxPortNumber}).`
      );
    }
  }

  // Aggregate conditions to disable the update
  const disableUpdate = Boolean(
    areNewMappingsInvalid ||
    duplicatedContainerPorts.length > 0 ||
    duplicatedHostPorts.length > 0 ||
    conflictingPorts.length > 0 ||
    arePortsTheSame ||
    updating ||
    portsOverTheMax.length > 0
  );

  return (
    <>
      <table>
        <thead>
          <tr>
            <td className="subtle-header">Host port</td>
            <td className="subtle-header">Package port number</td>
            <td className="subtle-header">Protocol</td>
          </tr>
        </thead>
        <tbody>
          {ports.map(({ host, container, protocol, deletable }, i) => (
            <tr key={i}>
              <td>
                <Input
                  placeholder="Ephemeral port if unspecified"
                  value={host || ""}
                  onValueChange={(value: string) =>
                    editPort(i, { host: parseInt(value) || undefined })
                  }
                />
              </td>
              <td>
                {deletable ? (
                  <Input
                    placeholder="enter container port..."
                    value={container}
                    onValueChange={(value: string) =>
                      editPort(i, { container: parseInt(value) || undefined })
                    }
                  />
                ) : (
                  <Input
                    lock={true}
                    value={container}
                    onValueChange={() => { }}
                  />
                )}
              </td>
              <td>
                {deletable ? (
                  <Select
                    options={["TCP", "UDP"]}
                    value={protocol}
                    onValueChange={(value: string) =>
                      editPort(i, {
                        protocol:
                          value === "UDP" ? PortProtocol.UDP : PortProtocol.TCP
                      })
                    }
                  />
                ) : (
                  <Input
                    lock={true}
                    value={protocol}
                    onValueChange={() => { }}
                  />
                )}
              </td>

              {deletable && (
                <td className="delete">
                  <Button
                    className="network-delete-port-row"
                    onClick={() => removePort(i)}
                  >
                    <MdClose />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {errors.map(error => (
        <div className="error" key={error}>
          {error}
        </div>
      ))}

      {warnings.map(warning => (
        <div key={warning}>
          {warning}
        </div>
      ))}

      <div className="button-row">
        <Button
          variant={"dappnode"}
          onClick={onUpdateEnvsSubmit}
          disabled={disableUpdate}
        >
          Update port mappings
        </Button>

        <Button variant={"dappnode"} onClick={addNewPort}>
          New port <MdAdd />
        </Button>
      </div>
    </>
  );
}

/**
 * Convert a port mapping into a unique deterministic ID
 * @param portMappings
 */
function portsToId(portMappings: PortMapping[]): string {
  return portMappings
    .map(({ host, container, protocol }) =>
      [host, container, protocol].join("")
    )
    .join("");
}

/**
 * Util: Returns object ready to check if a port is used or not
 * @return
 * ```
 * hostPortMappings = { "8080/TCP": "bitcoin.dnp.dappnode.eth" }
 * ```
 */
function getHostPortMappings(dnps: InstalledPackageData[]) {
  const hostPortMappings: { [portId: string]: string } = {};
  for (const dnp of dnps)
    for (const container of dnp.containers)
      for (const port of container.ports || [])
        if (port.host) hostPortMappings[getHostPortId(port)] = dnp.dnpName;
  return hostPortMappings;
}

function getHostPortId(port: PortMapping): string {
  return `${port.host}/${port.protocol}`;
}
