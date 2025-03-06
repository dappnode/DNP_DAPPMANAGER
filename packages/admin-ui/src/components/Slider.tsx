import React, { useState } from "react";
import "./Slider.scss";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  unit?: string;
  onChange?: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  unit = "%",
  onChange,
}) => {
  const [sliderValue, setSliderValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setSliderValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div className="slider-container">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={handleChange}
        className="slider-component"
      />
      <span className="slider-value">{sliderValue} {unit && unit}</span>
    </div>
  );
};

export default Slider;
