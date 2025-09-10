import React from "react";
import { title } from "../data";
// Components
import Title from "components/Title";
// Style
import "../components/packages.scss";
import { PackagesNavigator } from "../components/PackagesNavigator";

export function PackagesHome() {
  return (
    <>
      <Title title={title} />
      <PackagesNavigator />;
    </>
  );
}
