import React from "react";
import InputGroup from "react-bootstrap/esm/InputGroup";
import FormControl, { FormControlProps } from "react-bootstrap/esm/FormControl";

export interface InputProps {
  onEnterPress?: () => void;
  onValueChange: (value: string) => void;
  value: string | number;
  lock?: boolean;
  prepend?: string | React.ReactElement;
  append?: string | React.ReactElement;
  className?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
}

const Input: React.FC<InputProps & FormControlProps> = ({
  value,
  onValueChange,
  onEnterPress,
  lock,
  prepend,
  append,
  className,
  type,
  ...props
}) => {
  /**
   * Construct the basic input element
   */
  const input = (
    <FormControl
      type={type || "text"}
      onChange={e => {
        onValueChange(e.target.value);
      }}
      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key === 13 && onEnterPress) onEnterPress();
      }}
      value={value}
      readOnly={lock}
      {...props}
    />
  );

  if (prepend && append)
    return (
      <InputGroup>
        <InputPrepend>{prepend}</InputPrepend>
        {input}
        <InputAppend>{append}</InputAppend>
      </InputGroup>
    );

  if (prepend)
    return (
      <InputGroup>
        <InputPrepend>{prepend}</InputPrepend>
        {input}
      </InputGroup>
    );

  if (append)
    return (
      <InputGroup>
        {input}
        <InputAppend>{append}</InputAppend>
      </InputGroup>
    );

  return input;
};

/**
 * If children is plain text wrapper it with InputGroupText
 * Otherwise return children as-is. Use React.Fragment due to Typescript
 */
const InputPrepend: React.FC = ({ children }) => (
  <InputGroup.Prepend>
    {typeof children === "string" ? (
      <InputGroup.Text>{children}</InputGroup.Text>
    ) : (
      children
    )}
  </InputGroup.Prepend>
);

const InputAppend: React.FC = ({ children }) => (
  <InputGroup.Append>
    {typeof children === "string" ? (
      <InputGroup.Text>{children}</InputGroup.Text>
    ) : (
      children
    )}
  </InputGroup.Append>
);

export default Input;
