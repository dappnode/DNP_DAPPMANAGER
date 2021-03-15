import React from "react";
import "./list.scss";
import { IconType } from "react-icons/lib";

interface Item {
  isFulFilled?: boolean;
  title: string;
  message: string;
  errorMessage?: string;
}

interface ListProps {
  listTitle?: string;
  items: Item[];
  IconLeft: IconType;
  IconLeftFalse?: IconType;
  IconRight?: IconType;
}

export const List: React.FC<ListProps &
  React.HTMLAttributes<HTMLDivElement>> = ({
  listTitle,
  items,
  IconLeft,
  IconLeftFalse,
  IconRight,
  ...props
}) => {
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
              {IconLeftFalse && item.isFulFilled === false ? (
                <IconLeftFalse color="#FF0000" />
              ) : (
                <IconLeft color="#00BC9F" />
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

            {IconRight ? (
              <span className="icon-container-right">
                <IconRight color="#BDBFBF" />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </span>
  );
};
