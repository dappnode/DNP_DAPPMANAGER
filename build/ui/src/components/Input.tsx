import React from "react";
import "./input.css";

interface InputProps {
  onEnterPress?: () => void;
  onValueChange: (value: string) => void;
  value: string | number;
  lock?: boolean;
  isInvalid?: boolean;
  prepend?: string | React.ReactElement;
  append?: string | React.ReactElement;
  className?: string;
  type?: string;
}

const Input: React.FunctionComponent<
  InputProps & React.HTMLAttributes<HTMLInputElement>
> = ({
  value,
  onValueChange,
  onEnterPress,
  lock,
  isInvalid,
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
    <input
      type={type || "text"}
      className={`form-control ${className} ${isInvalid ? "is-invalid" : ""}`}
      onChange={e => onValueChange(e.target.value)}
      onKeyPress={e => {
        const key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key === 13 && onEnterPress) onEnterPress();
      }}
      value={value}
      // Lock props
      readOnly={lock}
      {...props}
    />
  );

  /**
   * Add the `append` and `prepend` components
   */
  let inputWithPreAndAppend;

  if (prepend && append)
    inputWithPreAndAppend = (
      <div className="input-group">
        <div className="input-group-prepend">
          {typeof prepend === "string" ? (
            <span className="input-group-text">{prepend}</span>
          ) : (
            prepend
          )}
        </div>
        {input}
        <div className="input-group-append">
          {typeof append === "string" ? (
            <span className="input-group-text">{append}</span>
          ) : (
            append
          )}
        </div>
      </div>
    );
  else if (prepend)
    inputWithPreAndAppend = (
      <div className="input-group">
        <div className="input-group-prepend">
          {typeof prepend === "string" ? (
            <span className="input-group-text">{prepend}</span>
          ) : (
            prepend
          )}
        </div>
        {input}
      </div>
    );
  else if (append)
    inputWithPreAndAppend = (
      <div className="input-group">
        {input}
        <div className="input-group-append">
          {typeof append === "string" ? (
            <span className="input-group-text">{append}</span>
          ) : (
            append
          )}
        </div>
      </div>
    );
  else inputWithPreAndAppend = input;

  /**
   * Return the final component
   */
  return inputWithPreAndAppend;
};

export default Input;
