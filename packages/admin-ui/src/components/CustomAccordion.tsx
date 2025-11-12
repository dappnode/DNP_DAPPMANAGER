import React, { useState } from "react";
import { Accordion, Card, useAccordionButton } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import "./customAccordion.scss";

interface CustomAccordionProps {
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface CustomAccordionItemProps {
  header: React.ReactNode;
  children: React.ReactNode;
  eventKey?: string;
  isOpen?: boolean;
  toggle?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

export function CustomAccordion({ defaultOpen = true, children }: CustomAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = useAccordionButton("0", () => setIsOpen((v) => !v));

  return (
    <Accordion activeKey={isOpen ? "0" : undefined} className="custom-accordion">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<CustomAccordionItemProps>,
              {
                eventKey: "0" as string,
                isOpen,
                toggle
              } as Partial<CustomAccordionItemProps>
            )
          : child
      )}
    </Accordion>
  );
}

export function CustomAccordionItem({
  header,
  children,
  eventKey = "0",
  isOpen = true,
  toggle
}: CustomAccordionItemProps) {
  return (
    <Accordion.Item eventKey={eventKey}>
      <Card>
        <Card.Header
          as="div"
          className={`custom-accordion-header ${!isOpen ? "closed" : ""}`}
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle && toggle(e);
            }
          }}
        >
          <>
            {header} {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </>
        </Card.Header>
        <Accordion.Body>
          <Card.Body>{children}</Card.Body>
        </Accordion.Body>
      </Card>
    </Accordion.Item>
  );
}
