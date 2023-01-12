import React from "react";
import Form from "react-bootstrap/esm/Form";
import Input, { InputProps } from "./Input";
import { InputSecret } from "./InputSecret";
import "./inputForm.scss";
import Select from "./Select";

interface InputFormFieldProps extends InputProps {
  labelId: string;
  label: string;
  secret?: boolean;
  error?: string | null;
  options?: string[];
}

interface InputFormProps {
  fields: InputFormFieldProps[];
  children?: React.ReactNode;
  childrenBefore?: React.ReactNode;
}

export const InputForm: React.FC<InputFormProps> = ({
  fields,
  children,
  childrenBefore
}) => {
  return (
    <Form className="input-form" onSubmit={e => e.preventDefault()}>
      {childrenBefore}

      {fields.map(({ labelId, label, secret, error, ...props }) => {
        const isInvalid = Boolean(props.value && error);
        return (
          <Form.Group key={labelId} controlId={labelId}>
            <Form.Label>{label}</Form.Label>
            {props.options ? (
              <Select
                {...props}
                value={props.value as string}
                options={props.options as string[]}
              />
            ) : secret ? (
              <InputSecret isInvalid={isInvalid} required {...props} />
            ) : (
              <Input
                isInvalid={isInvalid}
                // All consumers of this input form require all fields
                // Add a prop "optional" if a field it's not required
                required
                {...props}
              />
            )}

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
