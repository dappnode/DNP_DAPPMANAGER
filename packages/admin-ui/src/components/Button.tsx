import React from "react";
import { Button as ButtonMui, ButtonProps } from "@mui/material";

// Todo: add variants for dappnode

const defaultVariant = "contained";

const Button: React.FC<ButtonProps> = (props: ButtonProps) => {
  return (
    <ButtonMui {...props} variant={props.variant || defaultVariant}>
      {props.children}
    </ButtonMui>
  );
};

export default Button;
