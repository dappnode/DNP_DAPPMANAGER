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
      onChange={(e) => onValueChange(e.target.value)}
      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.charCode || e.keyCode || 0;
        if (key === 13 && onEnterPress) onEnterPress();
      }}
      value={value}
      readOnly={lock}
      {...props}
    />
  );

  return (
    <InputGroup>
      {prepend && (typeof prepend === "string" ? <InputGroup.Text>{prepend}</InputGroup.Text> : prepend)}
      {input}
      {append && (typeof append === "string" ? <InputGroup.Text>{append}</InputGroup.Text> : append)}
    </InputGroup>
  );
};

export default Input;
