import React from "react";
import Select from "components/Select";

export default function InputFieldSelect({
  value,
  options,
  onValueChange
}: {
  value: string;
  options: string[];
  onValueChange: (newValue: string) => void;
}) {
  return (
    <Select
      value={value}
      options={[
        ...(!options.includes(value) ? ["Select value"] : []),
        ...options
      ]}
      onValueChange={onValueChange}
    />
  );
}
