import React from "react";
import { IconType } from "react-icons/lib";
import { joinCssClass } from "utils/css";
import "./button.scss";

export type ButtonType = "button" | "submit" | "reset" | undefined;
export type ButtonVariant =
  | "secondary"
  | "dappnode"
  | "warning"
  | "danger"
  | "outline-secondary"
  | "outline-dappnode"
  | "outline-warning"
  | "outline-danger";
const defaultVariant: ButtonVariant = "outline-secondary";

interface ButtonProps {
  variant?: ButtonVariant;
  pill?: boolean;
  fullwidth?: boolean;
  disabled?: boolean;
  type?: ButtonType;
  Icon?: IconType;
}

const Button: React.FC<ButtonProps &
  React.HTMLAttributes<HTMLButtonElement>> = ({
  variant = defaultVariant,
  children,
  pill,
  fullwidth,
  className,
  disabled,
  Icon,
  ...props
}) => (
  <button
    className={joinCssClass(
      `btn btn-${variant}`,
      { pill, fullwidth },
      className
    )}
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

export default Button;
