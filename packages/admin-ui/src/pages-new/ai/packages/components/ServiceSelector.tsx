import React from "react";
import { Label } from "components/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { PackageContainer } from "@dappnode/types";

export function ServiceSelector({
  serviceName,
  setServiceName,
  containers
}: {
  serviceName: string;
  setServiceName: (name: string) => void;
  containers: PackageContainer[];
}) {
  const serviceNames = containers.map((c) => c.serviceName);
  if (serviceNames.length <= 1) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-3">
      <Label className="tw:text-sm tw:font-medium tw:text-muted-foreground tw:shrink-0">Service</Label>
      <Select value={serviceName} onValueChange={setServiceName}>
        <SelectTrigger className="tw:w-56">
          <SelectValue placeholder="Select service" />
        </SelectTrigger>
        <SelectContent className="tw-base">
          {serviceNames.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
