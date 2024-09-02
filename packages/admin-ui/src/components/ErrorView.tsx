import React from "react";
import errorImg from "img/error-min.png";
import "./errorView.scss";
import { joinCssClass } from "utils/css";

export default function ErrorView({
  error,
  hideIcon,
  red
}: {
  error: Error | string;
  hideIcon?: boolean;
  red?: boolean;
}) {
  const { message, detail } = parseError(error);

  return (
    <div className={joinCssClass("error-view", { red })}>
      {!hideIcon && <img src={errorImg} alt="Error icon" />}

      {detail ? (
        <details>
          <summary>{message.split("\n")[0]}</summary>
          <pre>{detail}</pre>
        </details>
      ) : (
        <span className="only-summary">{message}</span>
      )}
    </div>
  );
}

function parseError(error: Error | string) {
  if (error instanceof Error) return { message: error.message, detail: error.stack };
  if (typeof error === "string") return { message: error };
  return { message: JSON.stringify(error), detail: "" };
}
