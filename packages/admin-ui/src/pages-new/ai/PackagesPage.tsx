import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "components/primitives/card";
import { Package, CircleCheck, CirclePause, CircleX } from "lucide-react";

type PackageStatus = "running" | "stopped" | "error";

interface AiPackage {
  name: string;
  description: string;
  version: string;
  status: PackageStatus;
}

const mockPackages: AiPackage[] = [
  {
    name: "Local LLM Runtime",
    description: "Large language model inference engine running on your hardware.",
    version: "1.2.0",
    status: "running"
  },
  {
    name: "Node Diagnostics Agent",
    description: "Monitors node health and provides AI-powered diagnostics.",
    version: "0.9.4",
    status: "stopped"
  },
  {
    name: "Smart Config Wizard",
    description: "Auto-tunes client settings based on hardware profiling.",
    version: "0.3.1",
    status: "error"
  }
];

const statusConfig: Record<PackageStatus, { label: string; icon: React.ReactNode; className: string }> = {
  running: {
    label: "Running",
    icon: <CircleCheck className="tw:size-4" />,
    className: "tw:text-green-600 tw:dark:text-green-400"
  },
  stopped: {
    label: "Stopped",
    icon: <CirclePause className="tw:size-4" />,
    className: "tw:text-muted-foreground"
  },
  error: {
    label: "Error",
    icon: <CircleX className="tw:size-4" />,
    className: "tw:text-destructive"
  }
};

/**
 * AI Packages page — view and manage installed AI packages.
 */
export function PackagesPage() {
  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      <header>
        <h1 className="tw:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">Packages</h1>
        <p className="tw:mt-header-gap tw:text-muted-foreground tw:max-w-2xl">
          View and manage the AI packages installed on your Dappnode. Monitor status, versions and control lifecycle.
        </p>
      </header>

      <div className="tw:flex tw:flex-col tw:gap-card">
        {mockPackages.map((pkg) => {
          const status = statusConfig[pkg.status];
          return (
            <Card key={pkg.name} className="tw:transition-all tw:duration-200 tw:hover:ring-2 tw:hover:ring-primary/20">
              <CardHeader>
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:flex tw:items-center tw:justify-center tw:size-10 tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                      <Package className="tw:size-5" />
                    </div>
                    <div>
                      <CardTitle>{pkg.name}</CardTitle>
                      <CardDescription className="tw:mt-0.5">v{pkg.version}</CardDescription>
                    </div>
                  </div>
                  <div className={`tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium ${status.className}`}>
                    {status.icon}
                    {status.label}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="tw:text-sm tw:text-muted-foreground">{pkg.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
