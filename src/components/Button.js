import React from "react";

function Button({ children, type = "button", onClick, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;