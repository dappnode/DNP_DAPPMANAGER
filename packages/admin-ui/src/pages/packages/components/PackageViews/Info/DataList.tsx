import React from "react";

export default function DataList({
  title,
  data
}: {
  title: string;
  data: React.ReactElement[];
}) {
  if (!data.length) return null;
  return (
    <div>
      <strong>{title}: </strong>
      <ul>
        {data.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
