import React, { useEffect } from "react";
import { useApi } from "api";
// Own module
import VolumesGrid from "./VolumesGrid";
import { HostStats } from "pages/dashboard/components/HostStats";
// Components
import SubTitle from "components/SubTitle";

export default function SystemInfo() {
  const cpuStats = useApi.getCPUStats();
  const memoryStats = useApi.getMemoryStats();
  const diskStats = useApi.getDiskStats();

  useEffect(() => {
    const interval = setInterval(cpuStats.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats]);

  useEffect(() => {
    const interval = setInterval(diskStats.revalidate, 1000);
    // eslint-disable-next-line no-console
    console.log(diskStats);
    return () => {
      clearInterval(interval);
    };
  }, [diskStats]);

  useEffect(() => {
    const interval = setInterval(memoryStats.revalidate, 1000);
    // eslint-disable-next-line no-console
    console.log(memoryStats);
    return () => {
      clearInterval(interval);
    };
  }, [memoryStats]);

  return (
    <>
      <SubTitle>Machine stats</SubTitle>
      <HostStats />

      <SubTitle>Volumes</SubTitle>
      <VolumesGrid />
    </>
  );
}
