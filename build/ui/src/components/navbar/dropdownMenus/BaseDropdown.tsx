import React, { useState, useEffect, useRef } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import RenderMarkdown from "components/RenderMarkdown";
import "./dropdown.scss";
import { HelpTo } from "components/Help";

// Utilities

const ProgressBarWrapper = ({ progress }: { progress: number }) => {
  const progressPercent = Math.floor(100 * progress);
  return (
    <ProgressBar
      now={progressPercent}
      animated={true}
      label={`${progressPercent}%`}
    />
  );
};

function parseMessagesType(messages: BaseDropdownMessage[]) {
  const notViewedTypes: { [type: string]: boolean } = {};
  for (const message of messages)
    if (!message.viewed && message.type) notViewedTypes[message.type] = true;

  for (const type of ["danger", "warning", "success"])
    if (notViewedTypes[type]) return type;
  return "light";
}

function areMessagesUnread(messages: BaseDropdownMessage[]) {
  return messages.some(message => message && !message.viewed);
}

type MessageType = "danger" | "warning" | "success";

interface BaseDropdownMessage {
  type?: MessageType;
  title?: string | JSX.Element;
  body?: string;
  help?: string; // href link to attach to help icon
  progress?: number;
  showProgress?: boolean;
  viewed?: boolean;
}

interface BaseDropdownProps {
  name: string;
  messages: BaseDropdownMessage[];
  className?: string;
  placeholder?: string;
  Icon: any;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  offset?: number;
  moreVisible?: boolean;
}

function BaseDropdown({
  name,
  messages,
  Icon,
  onClick,
  className,
  placeholder,
  moreVisible
}: BaseDropdownProps) {
  const [collapsed, setCollapsed] = useState(true);
  const dropdownEl = useRef<HTMLDivElement>(null);

  function onToggle(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    setCollapsed(!collapsed);
    if (typeof onClick === "function") onClick(e);
  }

  useEffect(() => {
    /**
     * As recommended in https://github.com/airbnb/react-outside-click-handler/blob/master/src/OutsideClickHandler.jsx
     * it is better to listen to mousedown, then subscribe to mouseup,
     * and then collpase the menu. This also helps with the case of
     * using the toggle to close the menu. This is why the ref is in
     * the general dropdown div, not in the dropdown menu.
     */
    if (collapsed) return; // Prevent unnecessary listeners
    function handleMouseUp(e: MouseEvent) {
      document.removeEventListener("mouseup", handleMouseUp);
      if (
        dropdownEl.current &&
        e.target &&
        !dropdownEl.current.contains(e.target as Node)
      )
        setCollapsed(true);
    }
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownEl.current &&
        e.target &&
        !dropdownEl.current.contains(e.target as Node)
      )
        document.addEventListener("mouseup", handleMouseUp);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [collapsed]);

  if (!Array.isArray(messages)) {
    console.error("messages must be an array");
    return null;
  }

  // A message type can be "", ignore it
  const globalType = parseMessagesType(messages);
  const messagesAvailable = areMessagesUnread(messages);

  const attentionGrab = moreVisible && messagesAvailable;
  return (
    <div ref={dropdownEl} className={`tn-dropdown ${className}`}>
      <div
        onClick={onToggle}
        className={
          "tn-dropdown-toggle" + (attentionGrab ? " atention-grab" : "")
        }
        data-toggle="tooltip"
        data-placement="bottom"
        title={name}
        data-delay="300"
      >
        <Icon />
        <div className={`icon-bubble ${globalType}`} />
      </div>

      {/* offset controls the position of the dropdown menu.
        It's purpose is to control clipping on small screens, 
        by placing them as right as possible */}
      <div className={`menu ${collapsed ? "" : "show"}`}>
        <div className="header">{name}</div>
        {messages.map(
          ({ type, title, body, progress, showProgress, help }, i) => (
            <div key={i}>
              {title && (
                <div className="title">
                  <span className={`text text-${type}`}>{title}</span>
                  {help && <HelpTo url={help} />}
                </div>
              )}

              {body && (
                <div className="text">
                  <RenderMarkdown source={body} noMargin />
                </div>
              )}

              {showProgress && typeof progress === "number" && (
                <ProgressBarWrapper progress={progress} />
              )}
            </div>
          )
        )}
        {!messages.length && placeholder && (
          <div className="placeholder">{placeholder}</div>
        )}
      </div>
    </div>
  );
}

export default BaseDropdown;
