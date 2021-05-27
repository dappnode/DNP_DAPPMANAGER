import React from "react";
import "./switch.scss";
import { joinCssClass } from "utils/css";

interface SwitchProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
  highlightOnHover?: boolean;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onToggle,
  label = "",
  id,
  className,
  highlightOnHover,
  disabled,
  ...props
}) => {
  if (!id) id = String(Math.random()).slice(2);
  return (
    <span
      className={joinCssClass("switch switch-sm", className, {
        highlightOnHover
      })}
    >
      <input
        type="checkbox"
        className="switch"
        id={id}
        checked={checked}
        onChange={() => onToggle(!checked)}
        disabled={disabled}
        {...props}
      />
      <label htmlFor={id}>{label}</label>
    </span>
  );
};

export default Switch;
