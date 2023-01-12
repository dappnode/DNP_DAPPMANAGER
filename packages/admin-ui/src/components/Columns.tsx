import React from "react";
import { joinCssClass } from "utils/css";
import "./columns.scss";

/**
 * Display childrens as two columns
 */
const Columns: React.FC<{
  children: React.ReactNode;
  className?: string;
  spacing?: boolean;
}> = ({ children, className, spacing, ...props }) => (
  <div className={joinCssClass("columns", className, { spacing })} {...props}>
    {children}
  </div>
);

export default Columns;
