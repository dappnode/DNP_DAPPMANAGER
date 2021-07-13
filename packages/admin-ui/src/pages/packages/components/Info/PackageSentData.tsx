import { CopiableInput } from "components/CopiableText";
import React from "react";
import { isSecret } from "utils/isSecret";

export function RenderPackageSentData({
  data
}: {
  data: Record<string, string>;
}) {
  const entries = Object.entries(data);

  if (entries.length === 0) return null;

  return (
    <div className="package-sent-data">
      <header className="list-grid-header">Key</header>
      <header className="list-grid-header">Package sent values</header>

      {entries.map(([key, value]) => (
        <React.Fragment key={key}>
          <div>{key}</div>
          <div>
            <CopiableInput value={value} isSecret={isSecret(key)} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
