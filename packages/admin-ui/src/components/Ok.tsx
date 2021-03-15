import React from "react";
import { MdCheck, MdClose, MdHelpOutline } from "react-icons/md";
import "./ok.scss";
import "./loader-icon.scss";

interface OkProps {
  ok?: boolean;
  loading?: boolean;
  unknown?: boolean;
  msg: string;
  title?: string;
}

const Ok: React.FC<OkProps & React.HTMLAttributes<HTMLDivElement>> = ({
  msg,
  title,
  ok,
  loading,
  unknown,
  ...props
}) => {
  return (
    <span className="ok-indicator" {...props}>
      <span className="icon-container">
        {ok ? (
          <MdCheck color="#1ccec0" />
        ) : loading ? (
          <div className="lds-ring">
            <div />
            <div />
            <div />
          </div>
        ) : unknown ? (
          <MdHelpOutline />
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
