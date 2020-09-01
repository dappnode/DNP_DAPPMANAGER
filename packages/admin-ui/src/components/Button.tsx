import React from "react";
import { IconType } from "react-icons/lib";
import "./button.scss";

type ButtonType = "button" | "submit" | "reset" | undefined;

interface ButtonProps {
  variant?: string;
  pill?: boolean;
  disabled?: boolean;
  type?: ButtonType;
  Icon?: IconType;
}

const Button: React.FC<ButtonProps &
  React.HTMLAttributes<HTMLButtonElement>> = ({
  variant,
  children,
  pill,
  className,
  disabled,
  Icon,
  ...props
}) => (
  <button
    className={`btn btn-${variant || "outline-secondary"} ${
      pill ? "pill" : ""
    } ${className || ""}`}
    disabled={disabled}
    {...props}
  >
    {Icon ? (
      <span className="btn-with-icon">
        <Icon />
        <span>{children}</span>
      </span>
    ) : (
      children
    )}
  </button>
);

export const ButtonLight: React.FC<ButtonProps &
  React.HTMLAttributes<HTMLButtonElement>> = props => (
  <Button variant={"outline-secondary"} {...props}>
    {props.children}
  </Button>
);

export default Button;
