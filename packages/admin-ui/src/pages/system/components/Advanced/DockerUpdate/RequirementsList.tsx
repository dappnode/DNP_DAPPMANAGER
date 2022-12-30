import React from "react";
import Ok from "components/Ok";
import { UpdateRequirement } from "@dappnode/common";

export function RequirementsList({ items }: { items: UpdateRequirement[] }) {
  return (
    <div>
      {items.map(({ title, message, isFulFilled }, i) => (
        <div key={i}>
          <Ok {...{ title, msg: message, ok: isFulFilled }} />
        </div>
      ))}
    </div>
  );
}
