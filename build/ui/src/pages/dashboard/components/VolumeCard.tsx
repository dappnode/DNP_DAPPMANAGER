import React from "react";
import Card from "components/Card";
import { prettyBytes } from "utils/format";

export default function VolumeCard({
  name,
  size
}: {
  name: string;
  size: number;
}) {
  return (
    <Card className="volume-card">
      <div className="name">{name}</div>
      <div className="size">{prettyBytes(size)}</div>
    </Card>
  );
}
