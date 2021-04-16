import React from "react";
// Own module
import { title, maxIdLength, rootPath } from "../data";
// Components
import Title from "components/Title";

export default function WifiHome() {
  return (
    <>
      <Title title={title} />
      <p>Connect to your dappnode through wifi.</p>
    </>
  );
}
// Add default dappnode wifi hostpot credentials somewhere
// Brief introduction
// Allow to change wifi credentials
// Show wifi status
