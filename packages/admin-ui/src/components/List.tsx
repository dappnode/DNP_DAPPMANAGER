import React from "react";
import "./list.scss";
import { MdRadioButtonChecked, MdRadioButtonUnchecked } from "react-icons/md";

interface Item {
  isFulFilled?: boolean;
  title: string;
  message: string;
  errorMessage?: string;
}

interface ListProps {
  listTitle?: string;
  items: Item[];
}

export const List: React.FC<ListProps &
  React.HTMLAttributes<HTMLDivElement>> = ({ listTitle, items, ...props }) => {
  return (
    <span className="list" {...props}>
      {listTitle ? (
        <span className="list-title">
          <h5>{listTitle}</h5>
        </span>
      ) : null}
      <ul>
        {items.map(item => (
          <li key={item.title}>
            <span className="icon-container-left">
              {item.isFulFilled === false ? (
                <MdRadioButtonUnchecked color="#FF0000" />
              ) : (
                <MdRadioButtonChecked color="#00BC9F" />
              )}
            </span>
            <span className="title-container">
              <strong>{item.title}</strong>
            </span>
            <span className="message-container">
              <p>{item.message}</p>
            </span>
            {!item.isFulFilled && item.errorMessage ? (
              <span className="error-message-container">
                <p>. {item.errorMessage}</p>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </span>
  );
};
