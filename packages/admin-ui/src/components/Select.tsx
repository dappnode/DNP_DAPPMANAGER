import React from "react";

export default function Select({
  value,
  options,
  onValueChange,
  prepend
}: {
  value: string | undefined; // Allow undefined for no option selected
  options: string[];
  onValueChange: (newValue: string) => void;
  prepend?: string | React.ReactElement;
}) {
  const select = (
    <select value={value} className="form-control" onChange={(e) => onValueChange(e.target.value)}>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );

  if (prepend)
    return (
      <div className="input-group">
        <div className="input-group-prepend">
          {typeof prepend === "string" ? <span className="input-group-text">{prepend}</span> : prepend}
        </div>
        {select}
      </div>
    );
  else return select;
}
