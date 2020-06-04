import React, { useRef } from "react";
import Button from "components/Button";
import { render, unmountComponentAtNode } from "react-dom";
import RenderMarkdown from "components/RenderMarkdown";
import { stringIncludes } from "utils/strings";
import "./confirmDialog.scss";

interface ModalButtonData {
  label: string;
  variant?: string;
  onClick?: () => void;
}

interface ConfirmDialogProps {
  title: string;
  text: string;
  list?: {
    title: string;
    body: string;
  }[];
  buttons?: ModalButtonData[];
  // Main Button
  label?: string;
  onClick?: () => void;
  variant?: string;
}

/**
 * Render a dialog modal
 *
 * @param title Important action
 * @param text Are you sure you want to do this?
 * @param buttons = [{
 *   label: "Cancel",
 *   onClick: () => null
 * },{
 *   label: "Confirm",
 *   onClick: () => doImportantAction()
 * }, ... ]
 */
function Modal({
  title,
  text,
  list,
  buttons = [],
  label: mainLabel,
  onClick: mainOnClick,
  variant: mainVariant,
  onClose
}: ConfirmDialogProps & { onClose: () => void }) {
  // If user clicks the modal itself, do not close
  const modalEl = useRef(null);

  // Add a button from the shorthand form
  if (mainLabel && mainOnClick)
    buttons.push({
      label: mainLabel,
      onClick: mainOnClick,
      variant: mainVariant
    });

  // If there is no "Cancel" option, add it as the first
  if (!buttons.find(({ label }) => stringIncludes(label, "Cancel")))
    buttons.unshift({ label: "Cancel", variant: "outline-secondary" });

  return (
    <div
      className="confirm-dialog-root"
      ref={modalEl}
      onClick={e => {
        if (modalEl.current === e.target) onClose();
      }}
    >
      <div className="dialog no-p-style">
        {title && <h3 className="title">{title}</h3>}
        {text && (
          <div className="text">
            {typeof text === "string" ? <RenderMarkdown source={text} /> : text}
          </div>
        )}
        {list && Array.isArray(list) && list.length > 0 && (
          <div className="list">
            {list.map((item, i) => (
              <div key={i} className="list-item">
                <strong>{item.title}</strong>
                <div className="text">
                  {typeof item.body === "string" ? (
                    <RenderMarkdown source={item.body} />
                  ) : (
                    item.body
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="buttons">
          {buttons.map(({ label, variant, onClick }) => (
            <Button
              key={label}
              variant={variant || "outline-danger"}
              onClick={() => {
                if (onClick) onClick();
                onClose();
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// If multiple dialogs are used within a single session,
// the root-modal DOM node will be reused
let root: Element;
export function confirm(props: ConfirmDialogProps) {
  if (!root) {
    // Create the root-modal element
    root = document.createElement("div");
    document.body.appendChild(root);
  }
  // render (or re-render) and mount the dialog
  render(
    <Modal {...props} onClose={() => unmountComponentAtNode(root)} />,
    root
  );
}
