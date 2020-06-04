import React from "react";

type ButtonType = "button" | "submit" | "reset" | undefined;

interface ButtonProps {
  variant?: string;
  pill?: boolean;
  disabled?: boolean;
  type?: ButtonType;
}

const Button: React.FunctionComponent<
  ButtonProps & React.HTMLAttributes<HTMLButtonElement>
> = ({ variant, children, pill, className, disabled, ...props }) => (
  <button
    className={`btn btn-${variant || "outline-secondary"} ${
      pill ? "pill" : ""
    } ${className || ""}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

export const ButtonLight: React.FunctionComponent<
  ButtonProps & React.HTMLAttributes<HTMLButtonElement>
> = props => (
  <Button variant={"outline-secondary"} {...props}>
    {props.children}
  </Button>
);

export default Button;
