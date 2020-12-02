import React from "react";
import Input from "./Input";
import { InputSecret } from "./InputSecret";
import "./inputForm.scss";

interface InputFormProps {
  fields: {
    title: string;
    secret?: boolean;
    value: string;
    onValueChange: (newValue: string) => void;
    error?: string | null;
  }[];
}

export const InputForm: React.FC<InputFormProps> = ({ children, fields }) => {
  return (
    <div className="input-form">
      {fields.map(({ title, secret, value, onValueChange, error }, i) => {
        const InputComponent = secret ? InputSecret : Input;
        return (
          <div key={i} className="input-form-field">
            <div className="title">{title}</div>
            <InputComponent
              value={value}
              onValueChange={onValueChange}
              isInvalid={Boolean(value && error)}
            />
            {value && error && <div className="error-feedback">{error}</div>}
          </div>
        );
      })}

      {children}

      {/* <Button
        className="register-button"
        variant="dappnode"
        disabled={!isValid}
        onClick={onChangePassword}
      >
        Change password
      </Button> */}
    </div>
  );
};
