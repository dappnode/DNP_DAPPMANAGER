import React from "react";

export default function Select({
  value,
  options,
  onValueChange
}: {
  value: string | undefined; // Allow undefined for no option selected
  options: string[];
  onValueChange: (newValue: string) => void;
}) {
  return (
    <select
      value={value}
      className="form-control"
      onChange={e => onValueChange(e.target.value)}
    >
      {options.map(option => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
