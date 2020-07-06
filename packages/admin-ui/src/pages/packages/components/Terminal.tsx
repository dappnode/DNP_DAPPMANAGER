import React from "react";
import "./terminal.scss";

export function Terminal({ text, id }: { text: string; id: string }) {
  return (
    <div className="card">
      <div className="terminal" id={id}>
        {text || "No input"}
      </div>
    </div>
  );
}
