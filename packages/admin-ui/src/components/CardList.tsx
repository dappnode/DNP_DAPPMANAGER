import React from "react";

const CardList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`card card-list ${className}`} {...props}>
    {children}
  </div>
);

export default CardList;
