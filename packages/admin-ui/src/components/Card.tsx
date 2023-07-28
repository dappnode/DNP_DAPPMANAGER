import React from "react";
import { Card as MuiCard, CardProps as MuiCardProps } from "@mui/material";

// TODO: add other CARD api props

/**
 * [NOTE] style is injected to the card-body div via ...props
 */
const Card: React.FC<MuiCardProps & React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => <MuiCard>{children}</MuiCard>;

export default Card;
