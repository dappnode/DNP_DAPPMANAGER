import React from "react";

interface TitleProps {
  title: string;
  children?: string;
}

const Title: React.FC<TitleProps> = ({ title, children }) => {
  return <div className="section-title">{children ? children.toUpperCase() : title.toLocaleUpperCase()}</div>;
};

export default Title;
