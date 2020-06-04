import React from "react";
import { MdCheck, MdClose } from "react-icons/md";
import styled from "styled-components";
import "./loader-icon.css";

const styleIcon = {
  width: "1.35rem",
  height: "1.35rem"
};
const OkContainer = styled.span`
  display: flex;
`;
const IconContainer = styled.span`
  display: flex;
  margin-right: 6px;
`;

// margin-bottom: 2px;

interface OkProps {
  ok?: boolean;
  loading?: boolean;
  msg: string;
}

const Ok: React.FunctionComponent<
  OkProps & React.HTMLAttributes<HTMLDivElement>
> = ({ msg, ok, loading, ...props }) => {
  return (
    <OkContainer {...props}>
      <IconContainer>
        {ok ? (
          <MdCheck style={styleIcon} color="#1ccec0" />
        ) : loading ? (
          <div
            style={{ ...styleIcon, marginBottom: "2px" }}
            className="lds-ring"
          >
            <div />
            <div />
            <div />
          </div>
        ) : (
          <MdClose style={styleIcon} color="#ff0000" />
        )}
      </IconContainer>
      <span>{msg}</span>
    </OkContainer>
  );
};

export default Ok;
