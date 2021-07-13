import React, { useState, useEffect } from "react";
import ClipboardJS from "clipboard";
import InputGroup from "react-bootstrap/esm/InputGroup";
import Button from "components/Button";
import { GoEye, GoEyeClosed, GoClippy } from "react-icons/go";
import "./copiableText.scss";

export function CopiableInput({
  value,
  isSecret
}: {
  value: string;
  isSecret?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copiable-text-clipboard-append");
  }, []);

  return (
    <InputGroup>
      <input
        className="form-control copiable-input"
        type={!isSecret || show ? "text" : "password"}
        value={value}
        readOnly={true}
      />

      <InputGroup.Append>
        {isSecret && (
          <Button
            onClick={() => setShow(x => !x)}
            className="input-field-secret-toggle"
          >
            {show ? <GoEyeClosed /> : <GoEye />}
          </Button>
        )}
      </InputGroup.Append>

      <InputGroup.Append>
        <Button
          className="copiable-text-clipboard-append"
          data-clipboard-text={value}
        >
          <GoClippy />
        </Button>
      </InputGroup.Append>
    </InputGroup>
  );
}
