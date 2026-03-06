import React from 'react';
import { Link } from 'react-router-dom';

const AuthForm = ({ title, children, onSubmit, footerText, footerLink, footerLinkText, error }) => {
  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      <h2>{title}</h2>
      {error && <p style={{ color: 'var(--error-color)', textAlign: 'center' }}>{error}</p>}
      
      {children}

      <div className="form-footer">
        {footerText}{' '}
        <Link to={footerLink}>{footerLinkText}</Link>
      </div>
    </form>
  );
};

export default AuthForm;