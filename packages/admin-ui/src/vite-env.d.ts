/// <reference types="vite/client" />

// This module declaration enables importing SVG files as React components using the `?react` suffix.
// It works in conjunction with the SVGR plugin integration in Vite, allowing you to write:
//   import Logo from './logo.svg?react'
// and use <Logo /> as a React component in your code.
declare module "*.svg?react" {
  import * as React from "react";
  const Component: React.FC<React.SVGProps<SVGSVGElement>>;
  export default Component;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
