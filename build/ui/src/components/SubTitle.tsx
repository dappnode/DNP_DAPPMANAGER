import React from "react";

const SubTitle: React.FunctionComponent<{ className?: string }> = ({
  children,
  className
}) => <div className={`section-subtitle ${className || ""}`}>{children}</div>;

export default SubTitle;
