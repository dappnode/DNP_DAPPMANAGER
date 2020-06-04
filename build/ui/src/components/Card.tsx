import React from "react";
import BootstrapCard from "react-bootstrap/Card";
import { joinCssClass } from "utils/css";

const shadowStyle = { boxShadow: "1px 1px 15px 0 rgba(0, 0, 0, 0.07)" };

interface CardProps {
  shadow?: boolean;
  spacing?: boolean;
  divider?: boolean;
  noscroll?: boolean;
}

/**
 * [NOTE] style is injected to the card-body div via ...props
 */
const Card: React.FunctionComponent<
  CardProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  children,
  className = "",
  shadow,
  spacing,
  divider,
  noscroll,
  ...props
}) => (
  <BootstrapCard
    style={{
      overflowX: noscroll ? "visible" : "auto",
      ...(shadow ? shadowStyle : {})
    }}
  >
    <BootstrapCard.Body
      className={joinCssClass({
        spacing,
        divider,
        noscroll,
        [className]: className
      })}
      {...props}
    >
      {children}
    </BootstrapCard.Body>
  </BootstrapCard>
);

export default Card;
