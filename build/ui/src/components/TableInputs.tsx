import React from "react";
import Input from "components/Input";
import Select from "components/Select";
import Button from "components/Button";
import { MdClose } from "react-icons/md";
import "./tableInputs.scss";

// interface TableInputColumnProps {
//   empty?: boolean;
//   deleteButton?: boolean;
//   onClick?: () => void;
//   select?: boolean;
// }
type TableInputColumnProps = any;

/**
 * Note to self:
 * `styled.*` calls MUST be outside the render function.
 * Otherwise the reference to an element will change every
 * render and react will re-render the entire underlying
 * component. For example, an input will cause it to lose focus
 *
 * [NOTE]: Avoiding style-components here since there were too
 * many components re-rendering uselessly
 */

export default function TableInputs({
  headers,
  content,
  numOfRows = 2,
  rowsTemplate
}: {
  headers: string[];
  content: TableInputColumnProps[][];
  numOfRows?: number;
  rowsTemplate?: string;
}) {
  if (!Array.isArray(headers)) {
    // eslint-disable-next-line no-console
    console.error("headers must be an array");
    return null;
  }
  if (!Array.isArray(content)) {
    // eslint-disable-next-line no-console
    console.error("content must be an array");
    return null;
  }
  content.forEach(row => {
    if (!Array.isArray(row)) {
      // eslint-disable-next-line no-console
      console.error("row must be an array");
      return null;
    }
  });

  return (
    <div
      className="table-xn"
      style={{ gridTemplateColumns: rowsTemplate || "1fr ".repeat(numOfRows) }}
    >
      {headers.map((header, i) => (
        <div key={i} className="subtle-header">
          {header}
        </div>
      ))}
      {content.map((row, i) =>
        row.map((col, j) =>
          col.empty ? (
            <div key={`${i}${j}`} />
          ) : col.deleteButton ? (
            <Button
              key={`${i}${j}`}
              onClick={col.onClick}
              style={{
                display: "flex",
                fontSize: "1.5rem",
                padding: ".375rem",
                borderColor: "#ced4da"
              }}
            >
              <MdClose />
            </Button>
          ) : col.select ? (
            <Select key={`${i}${j}`} {...col} />
          ) : (
            <Input key={`${i}${j}`} {...col} />
          )
        )
      )}
    </div>
  );
}
