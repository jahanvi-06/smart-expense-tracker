import React from 'react';
import './Input.css';

const Input = ({
  label,
  error,
  id,
  type = 'text',
  className = '',
  required = false,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
          {required && <span className="input-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`input-field ${error ? 'input-field--error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        required={required}
        {...props}
      />
      {error && (
        <p className="input-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const Select = ({ label, error, id, children, className = '', required = false, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
          {required && <span className="input-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`input-field input-select ${error ? 'input-field--error' : ''}`}
        aria-invalid={!!error}
        required={required}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="input-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
