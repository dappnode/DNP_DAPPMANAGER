import React, { useState, useEffect } from "react";
import logoAnimated from "img/dappNodeAnimation.gif";
import "./loading.scss";

export default function Loading({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => i + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-view">
      <img src={logoAnimated} alt="Loading icon" />
      <p className="steps">{steps[index] || steps[steps.length - 1]}...</p>
    </div>
  );
}
