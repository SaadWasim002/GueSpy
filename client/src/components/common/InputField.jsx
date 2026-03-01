import React, { useState } from 'react';
import './InputField.css';

const InputField = ({ type = 'text', name, placeholder, value, onChange, required = true }) => {
  const isPassword = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="input-wrapper">
      <input
        type={isPassword ? (isPasswordVisible ? 'text' : 'password') : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="input-field"
      />
      {isPassword && (
        <button type="button" onClick={togglePasswordVisibility} className="password-toggle">
          {isPasswordVisible ? 'Hide' : 'Show'}
        </button>
      )}
    </div>
  );
};

export default InputField;