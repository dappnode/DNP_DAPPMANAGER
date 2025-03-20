import React from "react";
import { BiSearch } from "react-icons/bi";

import "./searchbar.scss";

interface SearchbarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  classname?: string;
  placeholder?: string;
}

export function Searchbar({ value, onChange, classname, placeholder = "Search..." }: SearchbarProps) {
  return (
    <div className="searchbar-wrapper">
      <BiSearch className="search-icon" />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`searchbar ${classname}`}
      />
    </div>
  );
}
