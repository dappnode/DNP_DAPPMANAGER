import React, { useState, ReactNode } from "react";
import { BsChevronDown } from "react-icons/bs";
import "./modernAccordion.scss";

/**
 * ModernAccordion - A reusable accordion component with modern styling
 *
 * @example
 * // Simple usage with string content
 * <ModernAccordion
 *   items={[
 *     { title: "Section 1", content: <p>Content here</p> },
 *     { title: "Section 2", content: <div>More content</div> }
 *   ]}
 *   allowMultipleOpen={true}
 * />
 *
 * @example
 * // With default open sections
 * <ModernAccordion
 *   items={items}
 *   allowMultipleOpen={false}
 *   defaultOpenIndexes={[0]}
 * />
 */

interface AccordionItemProps {
  title: string | ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className={`modern-accordion-item ${isOpen ? "open" : ""}`}>
      <button className="modern-accordion-header" onClick={onToggle} type="button">
        <span className="modern-accordion-title">{title}</span>
        <BsChevronDown className={`modern-accordion-icon ${isOpen ? "rotated" : ""}`} />
      </button>
      <div className={`modern-accordion-content ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="modern-accordion-body">{children}</div>
      </div>
    </div>
  );
}

interface ModernAccordionProps {
  items: {
    title: string | ReactNode;
    content: ReactNode;
  }[];
  allowMultipleOpen?: boolean;
  defaultOpenIndexes?: number[];
}

export function ModernAccordion({ items, allowMultipleOpen = true, defaultOpenIndexes = [] }: ModernAccordionProps) {
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
    <div className="modern-accordion">
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
