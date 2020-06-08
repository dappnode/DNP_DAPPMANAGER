import React from "react";
import errorImg from "img/error-min.png";
import "./errorView.scss";

export default function ErrorView({ error }: { error: Error | string }) {
  const { message, detail } = parseError(error);

  return (
    <div className="error-view">
      <img src={errorImg} alt="Error icon" />
      <details>
        <summary>{message.split("\n")[0]}</summary>
        <pre>{detail}</pre>
      </details>
    </div>
  );
}

function parseError(error: Error | string) {
  if (error instanceof Error)
    return { message: error.message, detail: error.stack };
  if (typeof error === "string") return { message: error };
  return { message: JSON.stringify(error), detail: "" };
}
