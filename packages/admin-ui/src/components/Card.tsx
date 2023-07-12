import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

interface CardProps {
  shadow?: boolean;
  spacing?: boolean;
  divider?: boolean;
  noscroll?: boolean;
}

const MyCard: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  shadow,
  spacing,
  divider,
  noscroll,
  ...props
}) => (
  <Card
    sx={{
      overflowX: noscroll ? "visible" : "auto"
    }}
    elevation={shadow ? 3 : 1} // Shadow: you can change this number based on how much shadow you want.
    {...props}
  >
    <CardContent>{children}</CardContent>
  </Card>
);

export default MyCard;
