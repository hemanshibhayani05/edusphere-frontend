import React from "react";
import { FiSearch } from "react-icons/fi";

function SearchBar({ value, onChange, placeholder = "Search courses..." }) {
  return (
    <div className="search-box">
      <FiSearch />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default SearchBar;