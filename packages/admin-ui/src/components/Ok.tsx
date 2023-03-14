import React from "react";
import { MdCheck, MdClose, MdHelpOutline, MdWarning } from "react-icons/md";
import "./ok.scss";
import "./loader-icon.scss";

interface OkProps {
  ok?: boolean;
  loading?: boolean;
  unknown?: boolean;
  warning?: boolean;
  msg: string;
  title?: string;
}

const Ok: React.FC<OkProps & React.HTMLAttributes<HTMLDivElement>> = ({
  msg,
  title,
  ok,
  loading,
  unknown,
  warning,
  ...props
}) => {
  return (
    <span className="ok-indicator" {...props}>
      <span className="icon-container">
        {ok ? (
          <MdCheck color="#00b1f4" /> // --dappnode-strong-main-color
        ) : loading ? (
          <div className="lds-ring">
            <div />
            <div />
            <div />
          </div>
        ) : unknown ? (
          <MdHelpOutline color="#00b1f4" /> // --dappnode-strong-main-color
        ) : warning ? (
          <MdWarning color="#ffff66" />
        ) : (
          <MdClose color="#ff0000" />
        )}
      </span>

      <span>
        {title && <strong>{title}: </strong>}
        {msg}
      </span>
    </span>
  );
};

export default Ok;
