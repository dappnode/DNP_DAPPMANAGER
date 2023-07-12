import React from "react";
import ButtonMUI from "@mui/material/Button";
import { ButtonProps as ButtonMUIProps } from "@mui/material/Button";
import Icon from "@mui/material/Icon"; // Add this line if your Icon is MUI icon

interface ButtonProps {
  Icon?: React.ComponentType;
}

const MyButton: React.FC<ButtonMUIProps & ButtonProps> = ({
  variant = "outlined",
  color = "primary",
  children,
  fullWidth,
  disabled,
  Icon,
  ...props
}) => (
  <ButtonMUI
    variant={variant}
    color={color}
    disabled={disabled}
    fullWidth={fullWidth}
    startIcon={Icon ? <Icon /> : null} // Apply the icon here
    {...props}
  >
    {children}
  </ButtonMUI>
);

export default MyButton;
