import React from "react";
import errorImg from "img/error-min.png";

const ErrorView = ({
  size = 200,
  msg
}: {
  size?: number;
  msg: string | Error;
}) => (
  <div className="vertical-container-centered">
    <div className="mb-5 mt-5">
      <h4 style={{ opacity: 0.6 }}>
        {msg instanceof Error ? msg.message : msg}
      </h4>
    </div>
    <img width={size} height={size} src={errorImg} alt="loading..." />
  </div>
);

export default ErrorView;
