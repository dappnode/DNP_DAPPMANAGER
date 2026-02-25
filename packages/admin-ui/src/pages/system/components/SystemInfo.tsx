import React, { useEffect } from "react";
import { useApi } from "api";
// Own module
import VolumesGrid from "./VolumesGrid";
// Components
import SubTitle from "components/SubTitle";
import SystemHealth from "pages/dashboard/components/SystemHealth";

export default function SystemInfo() {
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();

  useEffect(() => {
    const interval = setInterval(cpuStats.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats]);

  useEffect(() => {
    const interval = setInterval(diskStats.revalidate, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [diskStats]);

  useEffect(() => {
    const interval = setInterval(memoryStats.revalidate, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [memoryStats]);

  return (
    <>
      <SystemHealth />

      <SubTitle>Volumes</SubTitle>
      <VolumesGrid />
    </>
  );
}
