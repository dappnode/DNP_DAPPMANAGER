import React from "react";
import { IconType } from "react-icons/lib";
import ButtonBootstap, { ButtonProps as ButtonBootstrapProps } from "react-bootstrap/esm/Button";
import { joinCssClass } from "utils/css";
import "./button.scss";

export type ButtonType = "button" | "submit" | "reset" | undefined;
export type ButtonVariant =
  | "secondary"
  | "dappnode"
  | "warning"
  | "danger"
  | "info"
  | "outline-secondary"
  | "outline-dappnode"
  | "outline-warning"
  | "outline-danger"
  | "outline-info";
const defaultVariant: ButtonVariant = "outline-secondary";

interface ButtonProps {
  variant?: ButtonVariant;
  pill?: boolean;
  fullwidth?: boolean;
  disabled?: boolean;
  type?: ButtonType;
  Icon?: IconType;
}

const Button: React.FC<ButtonBootstrapProps & ButtonProps & React.HTMLAttributes<HTMLButtonElement>> = ({
  variant = defaultVariant,
  children,
  pill,
  fullwidth,
  className,
  disabled,
  Icon,
  ...props
}) => (
  <>
    <ButtonBootstap
      variant={variant}
      disabled={disabled}
      block={fullwidth}
      className={joinCssClass({ pill }, className)}
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
    </ButtonBootstap>
  </>
);

export default Button;
