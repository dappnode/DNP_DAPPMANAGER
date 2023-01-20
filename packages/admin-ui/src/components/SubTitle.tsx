import React from "react";

const SubTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => <div className={`section-subtitle ${className || ""}`}>{children}</div>;

export default SubTitle;
