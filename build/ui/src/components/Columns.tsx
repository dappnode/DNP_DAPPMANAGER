import React from "react";
import "./columns.scss";

/**
 * Display childrens as two columns
 */
const Columns: React.FunctionComponent<{ className?: string }> = ({
  children,
  className,
  ...props
}) => (
  <div className={`columns ${className || ""}`} {...props}>
    {children}
  </div>
);

export default Columns;
