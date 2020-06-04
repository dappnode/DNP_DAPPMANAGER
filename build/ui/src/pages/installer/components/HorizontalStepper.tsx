import React from "react";
import { joinCssClass } from "utils/css";
import "./horizontalStepper.scss";

interface HorizontalStepperProps {
  routes: string[];
  currentIndex: number;
}

const HorizontalStepper: React.FunctionComponent<HorizontalStepperProps> = ({
  routes,
  currentIndex
}) => (
  <div className="horizontal-stepper">
    {routes.map((route, i) => {
      const active = currentIndex === i;
      const completed = currentIndex > i;
      return (
        <div
          key={route}
          className={`steps-step ${joinCssClass({
            active,
            completed
          })}`}
        >
          <div className="connector">
            <span />
          </div>
          <span className="step-label">
            <span className="icon-container circle">
              {completed ? <span>✔</span> : <span>{i + 1}</span>}
            </span>
            <span className="text-container">
              <span className="text">{route}</span>
            </span>
          </span>
        </div>
      );
    })}
  </div>
);

export default HorizontalStepper;
