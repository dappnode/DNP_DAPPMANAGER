import React, { useState } from "react";
import Alert from "react-bootstrap/Alert";
import { Variant } from "react-bootstrap/esm/types";

/**
 * Util component, alert banner that can be closed with an X button
 */
export const AlertDismissible: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}> = ({ children, className, variant }) => {
  const [show, setShow] = useState(true);
  return show ? (
    <Alert
      variant={variant}
      onClose={() => setShow(false)}
      dismissible
      className={className}
    >
      {children}
    </Alert>
  ) : null;
};
