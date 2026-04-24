import React from "react";
import { useSystemHealth } from "hooks/useSystemHealth";
import { Card, CardHeader, CardTitle, CardContent } from "components/primitives/card";
import { Skeleton } from "components/primitives/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/primitives/tooltip";
import { Cpu, Thermometer, MemoryStick, HardDrive, Clock } from "lucide-react";

function getStatusColor(value: number, warning = 75, danger = 90): "primary" | "caution" | "destructive" {
  if (value > danger) return "destructive";
  if (value > warning) return "caution";
  return "primary";
}

export function SystemHealthSection() {
  const {
    cpuUsage,
    cpuTemp,
    memoryUsed,
    memoryTotal,
    memoryPercentage,
    diskUsed,
    diskTotal,
    diskPercentage,
    uptime,
    isLoading
  } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="tw:space-y-4">
          <Skeleton className="tw:h-6 tw:w-48" />
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="tw:h-20 tw:rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="tw:space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>

        <CardContent className="tw:space-y-4">
          {/* Uptime banner */}
          {uptime && (
            <>
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground">
                <Clock className="tw:size-4" />
                <span>
                  Your Dappnode has been running for:{" "}
                  <span className="tw:font-medium tw:text-foreground">{uptime}</span>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Stats grid */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
        <StatBlock icon={<Cpu className="tw:size-4" />} title="CPU Usage" value={`${cpuUsage}%`} percent={cpuUsage} />
        <StatBlock
          icon={<Thermometer className="tw:size-4" />}
          title="CPU Temp"
          value={`${cpuTemp}°C`}
          percent={cpuTemp}
          max={115}
          warning={85}
          danger={95}
        />
        <StatBlock
          icon={<MemoryStick className="tw:size-4" />}
          title="Memory"
          value={`${memoryUsed} / ${memoryTotal}`}
          percent={memoryPercentage}
        />
        <StatBlock
          icon={<HardDrive className="tw:size-4" />}
          title="Disk"
          value={`${diskUsed} / ${diskTotal}`}
          percent={diskPercentage}
        />
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  title,
  value,
  percent,
  max = 100,
  warning = 75,
  danger = 90
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  percent: number;
  max?: number;
  warning?: number;
  danger?: number;
}) {
  const normalized = Math.min(Math.round((percent / max) * 100), 100);
  const color = getStatusColor(percent, warning, danger);

  return (
    <Card className="tw:px-3">
      <div className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-muted-foreground">
          {icon}
          {title}
        </div>
        <span className="tw:text-sm tw:font-medium">{value}</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="tw:relative tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-muted">
              <div
                className={`tw:h-full tw:rounded-full tw:transition-all ${
                  color === "destructive"
                    ? "tw:bg-destructive"
                    : color === "caution"
                    ? "tw:bg-caution"
                    : "tw:bg-primary"
                }`}
                style={{ width: `${normalized}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{normalized}%</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
}
