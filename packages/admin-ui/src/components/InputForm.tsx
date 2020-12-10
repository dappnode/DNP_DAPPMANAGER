import React from "react";
import Form from "react-bootstrap/esm/Form";
import Input from "./Input";
import { InputSecret } from "./InputSecret";
import "./inputForm.scss";

interface InputFormProps {
  fields: {
    labelId: string;
    label: string;
    secret?: boolean;
    value: string;
    onValueChange: (newValue: string) => void;
    error?: string | null;
    autoFocus?: boolean;
  }[];
  childrenBefore?: React.ReactNode;
}

export const InputForm: React.FC<InputFormProps> = ({
  fields,
  children,
  childrenBefore
}) => {
  return (
    <Form className="input-form">
      {childrenBefore}

      {fields.map(
        ({
          labelId,
          label,
          secret,
          value,
          onValueChange,
          error,
          autoFocus
        }) => {
          const InputComponent = secret ? InputSecret : Input;
          return (
            <Form.Group key={labelId} controlId={labelId}>
              <Form.Label>{label}</Form.Label>
              <InputComponent
                value={value}
                onValueChange={onValueChange}
                isInvalid={Boolean(value && error)}
                autoFocus={autoFocus}
                // All consumers of this input form require all fields
                // Add a prop "optional" if a field it's not required
                required
              />

              {value && error && (
                <Form.Text className="text-danger">{error}</Form.Text>
              )}
            </Form.Group>
          );
        }
      )}

      {children}
    </Form>
  );
};
