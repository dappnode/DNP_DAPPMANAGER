import React from "react";
import InputGroup from "react-bootstrap/esm/InputGroup";
import { joinCssClass } from "utils/css";

export interface InputProps {
  onEnterPress?: () => void;
  onValueChange: (value: string) => void;
  value: string | number;
  lock?: boolean;
  prepend?: string | React.ReactElement;
  append?: string | React.ReactElement;
  className?: string;
  isInvalid?: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  /**
   * Triggers browser auto-completition by remembering inputs
   */
  name?: string;
  /**
   * Triggers browser functionality such as password generation
   * if autocomplete="new-password"
   */
  autoComplete?: string;
}

const Input: React.FC<InputProps & React.HTMLAttributes<HTMLInputElement>> = ({
  value,
  onValueChange,
  onEnterPress,
  isInvalid,
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
    // Using raw input instead of FormControl because it does not pass the prop
    // autocomplete, and it's necessary to trigger password generation on register
    <input
      className={joinCssClass("form-control", className, {
        "is-invalid": isInvalid
      })}
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
const InputPrepend: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <InputGroup.Prepend>
    {typeof children === "string" ? (
      <InputGroup.Text>{children}</InputGroup.Text>
    ) : (
      children
    )}
  </InputGroup.Prepend>
);

const InputAppend: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <InputGroup.Append>
    {typeof children === "string" ? (
      <InputGroup.Text>{children}</InputGroup.Text>
    ) : (
      children
    )}
  </InputGroup.Append>
);

export default Input;
