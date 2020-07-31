import React from "react";
import Switch from "react-switch";
import "./switchBig.scss";

const factor = 2;
const height = 28 * factor;
const width = 64 * factor;
const fontSize = 16 * factor;
const onColor = "#2fbcb2";
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

export default function SwitchBig({
  id,
  label,
  checked,
  onChange
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (bool: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="switch-big">
      <span>{label}</span>
      <Switch
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
