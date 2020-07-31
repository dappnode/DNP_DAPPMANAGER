import React from "react";

export function ErrorFeedback({ errors }: { errors: string[] }) {
  return (
    <div className="feedback-error">
      {errors.map((line, i) => (
        <span key={i}>
          {line}
          <br />
        </span>
      ))}
    </div>
  );
}
