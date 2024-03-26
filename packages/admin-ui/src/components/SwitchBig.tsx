import React from "react";
import Switch from "react-switch";
import "./switchBig.scss";

export default function SwitchBig({
  id,
  label,
  checked,
  onChange,
  disabled,
  factor = 1.5
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (bool: boolean) => void;
  disabled?: boolean;
  factor?: number;
}) {
  const labelClass = checked ? "blue-text" : "";
  const height = 28 * factor;
  const width = 64 * factor;
  const fontSize = 16 * factor;
  const onColor = "#00b1f4";
  const offColor = undefined; // "#bc2f39";
  const switchLabelProps = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    fontSize,
    color: "white",
    paddingRight: 2
  };
  return (
    <label htmlFor={id} className="switch-big">
      <span className={labelClass}>{label}</span>
      <Switch
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        uncheckedIcon={<div style={switchLabelProps}>OFF</div>}
        checkedIcon={<div style={switchLabelProps}>ON</div>}
        className="react-switch"
        id={id}
        onColor={onColor}
        offColor={offColor}
        height={height}
        width={width}
        handleDiameter={height * 0.7}
      />
    </label>
  );
}
