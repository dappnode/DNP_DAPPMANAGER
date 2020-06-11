import React from "react";
import { isEmpty } from "lodash";
import Button from "components/Button";

export default function TypeFilter({
  categories,
  onCategoryChange
}: {
  categories: { [category: string]: boolean };
  onCategoryChange: (category: string) => void;
}) {
  if (isEmpty(categories)) return null;

  return (
    <div className="type-filter">
      {Object.entries(categories)
        .sort()
        .map(([category, checked]) => (
          <Button
            key={category}
            onClick={() => onCategoryChange(category)}
            variant={checked ? "dappnode" : "outline-secondary"}
          >
            {category}
          </Button>
        ))}
    </div>
  );
}
