import React, { useState, ReactNode } from "react";
import { BsChevronDown } from "react-icons/bs";
import "./accordion.scss";

interface AccordionItemProps {
  title: string | ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className={`accordion-item ${isOpen ? "open" : ""}`}>
      <button className="accordion-header" onClick={onToggle} type="button">
        <span className="accordion-title">{title}</span>
        <BsChevronDown className={`accordion-icon ${isOpen ? "rotated" : ""}`} />
      </button>
      <div className={`accordion-content ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: {
    title: string | ReactNode;
    content: ReactNode;
  }[];
  allowMultipleOpen?: boolean;
  defaultOpenIndexes?: number[];
}

export function Accordion({ items, allowMultipleOpen = true, defaultOpenIndexes = [] }: AccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set(defaultOpenIndexes));

  const toggleSection = (index: number) => {
    setOpenIndexes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (allowMultipleOpen) {
          newSet.add(index);
        } else {
          // If only single open allowed, clear all and add the new one
          newSet.clear();
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openIndexes.has(index)}
          onToggle={() => toggleSection(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
