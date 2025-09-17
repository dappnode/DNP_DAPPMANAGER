import React, { useId, useState } from "react";
import "./switchText.scss";

export type SwitchTextProps = {
  leftLabel: string;
  rightLabel: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
};

const SwitchText: React.FC<SwitchTextProps> = ({
  leftLabel,
  rightLabel,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  ariaLabel,
  id,
  className = ""
}) => {
  const internalId = useId();
  const domId = id || `switch-text-${internalId}`;

  const isControlled = typeof checked === "boolean";
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const value = isControlled ? (checked as boolean) : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (!isControlled) setInternalChecked(false);
      onChange?.(false);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!isControlled) setInternalChecked(true);
      onChange?.(true);
    }
  };

  const rootClass = ["switch-text", value ? "is-checked" : "", disabled ? "is-disabled" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      id={domId}
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      className={rootClass}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      <span className="switch-text-track" aria-hidden="true">
        <span className="switch-text-half switch-text-left">{leftLabel}</span>
        <span className="switch-text-half switch-text-right">{rightLabel}</span>
        <span className="switch-text-thumb" />
      </span>
    </button>
  );
};

export default SwitchText;
