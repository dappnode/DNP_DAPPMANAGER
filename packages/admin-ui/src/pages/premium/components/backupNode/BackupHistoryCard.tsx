import React, { useState } from "react";
import SubTitle from "components/SubTitle";
import { Card } from "react-bootstrap";

import "./networkBackup.scss";

export const ActivationHistoryCard = ({
  activationsHistory,
  isActive
}: {
  activationsHistory: { activation_date: Date; end_date: Date }[];
  isActive: boolean;
}) => {
  return (
    <Card className="activation-history-card">
      <SubTitle>Activation history</SubTitle>
      <ActivationHistoryTable activationsHistory={activationsHistory} isActive={isActive} />
    </Card>
  );
};

const ActivationHistoryTable = ({
  activationsHistory,
  isActive
}: {
  activationsHistory: { activation_date: Date; end_date: Date }[];
  isActive: boolean;
}) => {
  const [sortBy, setSortBy] = useState<"number" | "start" | "end" | "duration">("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (!activationsHistory?.length) return <div className="no-history-label">No activations found.</div>;

  // If the backup is active, show the end_date and Time spent as ongoing
  // Find the index of the latest activation (by activation_date)
  const latestIdx = activationsHistory.reduce(
    (latest, curr, idx, arr) => (curr.activation_date > arr[latest].activation_date ? idx : latest),
    0
  );
  const isOngoing = isActive && latestIdx >= 0;

  const getDuration = (a: { activation_date: Date; end_date: Date }, ongoing = false) =>
    (ongoing ? Date.now() : a.end_date.getTime()) - a.activation_date.getTime();

  const sorted = [...activationsHistory].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "number") {
      cmp = activationsHistory.indexOf(a) - activationsHistory.indexOf(b);
    } else if (sortBy === "start") {
      cmp = a.activation_date.getTime() - b.activation_date.getTime();
    } else if (sortBy === "end") {
      cmp = a.end_date.getTime() - b.end_date.getTime();
    } else if (sortBy === "duration") {
      const aIdx = activationsHistory.indexOf(a);
      const bIdx = activationsHistory.indexOf(b);
      const aOngoing = isOngoing && aIdx === latestIdx;
      const bOngoing = isOngoing && bIdx === latestIdx;
      cmp = getDuration(a, aOngoing) - getDuration(b, bOngoing);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const SortArrow = ({ column }: { column: typeof sortBy }) => {
    const sortIcon = sortBy === column && (sortDir === "asc" ? "▲" : "▼");
    return <span className="blue-text sort-arrow">{sortIcon}</span>;
  };

  const TableHeader = ({ column, label }: { column: typeof sortBy; label: string }) => (
    <th onClick={() => handleSort(column)}>
      {label}
      <SortArrow column={column} />
    </th>
  );

  return (
    <div>
      <table>
        <thead>
          <tr>
            <TableHeader column="number" label="#" />
            <TableHeader column="start" label="Start date" />
            <TableHeader column="end" label="End date" />
            <TableHeader column="duration" label="Time spent" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((activation, idx) => {
            const originalIdx = activationsHistory.indexOf(activation);
            const ongoing = isOngoing && originalIdx === latestIdx;
            return (
              <tr key={idx}>
                <td>{originalIdx + 1}</td>
                <td>{activation.activation_date.toLocaleString()}</td>
                <td>
                  {ongoing ? <span className="ongoing-label">Ongoing</span> : activation.end_date.toLocaleString()}
                </td>
                <td>
                  {ongoing
                    ? `${((Date.now() - activation.activation_date.getTime()) / (1000 * 60 * 60)).toFixed(2)} hours`
                    : `${(
                        (activation.end_date.getTime() - activation.activation_date.getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(2)} hours`}
                  {ongoing && <span className="ongoing-label"> (in progress)</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
