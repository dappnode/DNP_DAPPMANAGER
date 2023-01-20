import React from "react";

interface TitleProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const Title: React.FC<TitleProps> = ({ title, subtitle, children }) => {
  if (children) return <div className="section-title">{children}</div>;
  if (subtitle)
    return (
      <div className="section-title">
        <span className="pre-title">{title} </span>
        {subtitle}
      </div>
    );
  return <div className="section-title">{title}</div>;
};

export default Title;
