import React from "react";
import Form from "react-bootstrap/esm/Form";
import Input, { InputProps } from "./Input";
import { InputSecret } from "./InputSecret";
import "./inputForm.scss";

interface InputFormFieldProps extends InputProps {
  labelId: string;
  label: string;
  secret?: boolean;
  error?: string | null;
}

interface InputFormProps {
  fields: InputFormFieldProps[];
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

      {fields.map(({ labelId, label, secret, error, ...props }) => {
        const InputComponent = secret ? InputSecret : Input;
        const isInvalid = Boolean(props.value && error);
        return (
          <Form.Group key={labelId} controlId={labelId}>
            <Form.Label>{label}</Form.Label>
            <InputComponent
              isInvalid={isInvalid}
              // All consumers of this input form require all fields
              // Add a prop "optional" if a field it's not required
              required
              {...props}
            />

            {isInvalid && (
              <Form.Text className="text-danger" as="span">
                {error}
              </Form.Text>
            )}
          </Form.Group>
        );
      })}

      {children}
    </Form>
  );
};
