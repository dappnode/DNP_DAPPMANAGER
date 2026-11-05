import React from "react";
// convert children into text
const SubTitle: React.FC<{ children: string; className?: string }> = ({ children, className }) => (
  <div className={`section-subtitle ${className || ""}`}>{children.toUpperCase()}</div>
);

export default SubTitle;
