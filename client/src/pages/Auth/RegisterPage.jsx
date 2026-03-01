import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { registerUser } from '../../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /\S+@\S+\.\S+/;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Validate email format
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      // As per PRD, on success, redirect to login.
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('User already exists with this email.');
      else if (status === 400) setError('Some fields are missing or invalid.');
      else setError('An unexpected error occurred. Please try again.'); // For 500 or network errors
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Create an Account"
        onSubmit={handleSubmit}
        error={error}
        footerText="Already have an account?"
        footerLink="/login"
        footerLinkText="Login"
      >
        <div className="form-group">
          <InputField name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
        </div>
        <div className="form-group">
          <InputField name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <InputField name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
        </div>
        <div className="form-group">
          <InputField name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />
        </div>
        <Button
          type="submit"
          disabled={
            loading ||
            !formData.username ||
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword
          }>{loading ? 'Registering...' : 'Register'}</Button>
      </AuthForm>
    </AuthLayout>
  );
};

export default RegisterPage;