import { BsSunFill, BsMoonFill } from "react-icons/bs";
import React from "react";
import { Button } from "react-bootstrap";
import "./themeSwitch.scss";

export default function ThemeSwitch({
  theme,
  setTheme
}: {
  theme: "light" | "dark";
  setTheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
}) {
  return (
    <button
      onClick={
        theme === "dark" ? () => setTheme("light") : () => setTheme("dark")
      }
    >
      {theme === "light" ? <BsMoonFill /> : <BsSunFill />}
    </button>
  );
}
