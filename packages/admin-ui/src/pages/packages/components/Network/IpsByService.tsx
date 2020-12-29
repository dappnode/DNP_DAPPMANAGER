import React from "react";

export function IpsByService({ ip }: { ip?: string }) {
  return (
    <div>
      <p>
        <strong>Container Ip: </strong>
        {ip ? ip : "Not available"}
      </p>
    </div>
  );
}
