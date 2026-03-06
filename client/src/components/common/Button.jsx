import React from 'react';
import './Button.css';

const Button = ({ children, type = 'submit', onClick, disabled = false, fullWidth = false }) => {
  const classes = `btn ${fullWidth ? 'btn-full-width' : ''}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
};

export default Button;