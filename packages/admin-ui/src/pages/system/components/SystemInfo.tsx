import React, { useEffect } from "react";
import { useApi } from "api";
// Own module
import VolumesGrid from "./VolumesGrid";
import { HostStats } from "pages/dashboard/components/HostStats";
// Components
import SubTitle from "components/SubTitle";

export default function SystemInfo() {
  const stats = useApi.getStats();

  useEffect(() => {
    const interval = setInterval(stats.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [stats]);

  return (
    <>
      <SubTitle>Machine stats</SubTitle>
      <HostStats />

      <SubTitle>Volumes</SubTitle>
      <VolumesGrid />
    </>
  );
}
