import React from "react";
import SubTitle from "components/SubTitle";
import { useSystemHealth } from "hooks/PWA/useSystemHealth";
import Card from "components/Card";
import { CpuIcon } from "./icons/CpuIcon";
import { MemoryIcon } from "./icons/MemoryIcon";
import { DiskIcon } from "./icons/DiskIcon";
import { CpuTempIcon } from "./icons/CpuTempIcon";
import { UptimeIcon } from "./icons/UptimeIcon";
import Loading from "components/Loading";
import { ProgressBar } from "react-bootstrap";
import "./systemHealth.scss";

export default function SystemHealth() {
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

  return (
    <div className="system-health">
      <SubTitle>SYSTEM HEALTH</SubTitle>
      <Card className="system-health-card">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className="uptime">
              <div className="uptime-header">
                <UptimeIcon />
                <div>Your Dappnode has been running for:</div>
              </div>
              <div className="uptime-label">{uptime}</div>
            </div>
            <hr />
            <div className="stats-grid">
              {" "}
              <StatBlock title="CPU Usage" icon={<CpuIcon />} data={`${cpuUsage}%`}>
                <CustomProgressBar value={cpuUsage} />
              </StatBlock>
              <StatBlock title="CPU Temp" icon={<CpuTempIcon />} data={`${cpuTemp}°C`}>
                <CustomProgressBar
                  value={cpuTemp}
                  max={115} // cpu temperature above 100/110 triggers automatic shutdowns in intel NUCs
                  danger={95}
                  warning={85}
                />
              </StatBlock>
              <StatBlock title="Memory" icon={<MemoryIcon />} data={`${memoryUsed} /${memoryTotal}`}>
                <CustomProgressBar value={memoryPercentage} />
              </StatBlock>
              <StatBlock title="Disk" icon={<DiskIcon />} data={`${diskUsed} /${diskTotal}`}>
                <CustomProgressBar value={diskPercentage} />
              </StatBlock>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function StatBlock({
  title,
  icon,
  data,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  data?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="stats-block">
      <div className="stats-block-header">
        <div className="title">
          {icon}
          {title}
        </div>
        {data ? <span>{data}</span> : null}
      </div>
      <div className="stats-block-child">{children}</div>
    </div>
  );
}

function parseVariant({ value, danger = 90, warning = 75 }: { value: number; danger?: number; warning?: number }) {
  if (value > danger) return "danger";
  if (value > warning) return "warning";
  return "info";
}

function CustomProgressBar({
  value,
  max,
  danger,
  warning,
  label
}: {
  value: number;
  max?: number;
  danger?: number;
  warning?: number;
  label?: string;
}) {
  return <ProgressBar variant={parseVariant({ value, danger, warning })} max={max || 100} now={value} label={label} />;
}
