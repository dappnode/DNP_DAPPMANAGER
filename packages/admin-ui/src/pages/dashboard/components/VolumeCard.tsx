import React from "react";
import Card from "components/Card";
import { prettyBytes } from "utils/format";
import { VolumeData } from "types";

export default function VolumeCard({ volumeData }: { volumeData: VolumeData }) {
  return (
    <Card className="volume-card">
      <div className="name">{volumeData.internalName}</div>
      {volumeData.size && (
        <div className="size">{prettyBytes(volumeData.size)}</div>
      )}
    </Card>
  );
}
