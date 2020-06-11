import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function StatsCard({ id, percent }: { id: string; percent: string }) {
  const value = parseInt(percent);
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{id}</span> <span className="usage">usage</span>
      </div>
      <ProgressBar variant={parseVariant(value)} now={value} label={percent} />
    </Card>
  );
}

export function HostStats() {
  const stats = useApi.getStats();

  useEffect(() => {
    const interval = setInterval(stats.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [stats]);

  return (
    <div className="dashboard-cards">
      {stats.data &&
        Object.entries(stats.data).map(([id, percent]) => (
          <StatsCard key={id} id={id} percent={percent} />
        ))}
    </div>
  );
}
