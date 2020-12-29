import React from "react";

export function IpsByService({ ip }: { ip?: string }) {
  return (
    <>
      <p>Container IP: {ip ? ip : "Not available"}</p>
    </>
  );
}
