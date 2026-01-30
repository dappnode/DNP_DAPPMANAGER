import React, { useState, ReactNode } from "react";
import { BsChevronDown } from "react-icons/bs";
import "./collapsibleList.scss";

interface CollapsibleListItemProps {
  title: string | ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function CollapsibleListItem({ title, children, isOpen, onToggle }: CollapsibleListItemProps) {
  return (
    <div className={`collapsible-list-item ${isOpen ? "open" : ""}`}>
      <button className="collapsible-list-header" onClick={onToggle} type="button">
        <span className="collapsible-list-title">{title}</span>
        <BsChevronDown className={`collapsible-list-icon ${isOpen ? "rotated" : ""}`} />
      </button>
      <div className={`collapsible-list-content ${isOpen ? "expanded" : "collapsed"}`}>
        <div className="collapsible-list-body">{children}</div>
      </div>
    </div>
  );
}

interface CollapsibleListProps {
  items: {
    title: string | ReactNode;
    content: ReactNode;
  }[];
  allowMultipleOpen?: boolean;
  defaultOpenIndexes?: number[];
}

export function CollapsibleList({ items, allowMultipleOpen = true, defaultOpenIndexes = [] }: CollapsibleListProps) {
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
    <div className="collapsible-list">
      {items.map((item, index) => (
        <CollapsibleListItem
          key={index}
          title={item.title}
          isOpen={openIndexes.has(index)}
          onToggle={() => toggleSection(index)}
        >
          {item.content}
        </CollapsibleListItem>
      ))}
    </div>
  );
}
