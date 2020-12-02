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
  childrenBefore?: React.ReactNode;
  childrenAfter?: React.ReactNode;
}

export const InputForm: React.FC<InputFormProps> = ({
  fields,
  childrenBefore,
  childrenAfter
}) => {
  return (
    <div className="input-form">
      {childrenBefore}

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

      {childrenAfter}
    </div>
  );
};
