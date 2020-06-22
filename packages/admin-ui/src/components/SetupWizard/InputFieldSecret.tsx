import React, { useState } from "react";
import Input from "components/Input";
import Button from "components/Button";
import { GoEye, GoEyeClosed } from "react-icons/go";

export function InputFieldSecret({
  value,
  onValueChange
}: {
  onValueChange: (value: string) => void;
  value: string | number;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Input
        value={value}
        onValueChange={onValueChange}
        type={show ? "text" : "password"}
        append={
          <Button
            onClick={() => setShow(x => !x)}
            className="input-field-secret-toggle"
          >
            {show ? <GoEyeClosed /> : <GoEye />}
          </Button>
        }
      />
    </>
  );
}
