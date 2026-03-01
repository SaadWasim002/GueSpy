import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /\S+@\S+\.\S+/;

    // Validate email format before submitting
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await loginUser(formData);
      auth.login(response.data.token);
      // As per PRD, redirect to the initial game screen.
      // We'll create a placeholder route for it.
      navigate('/game');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError('Incorrect email or password.');
      else if (status === 404) setError('No user exists with this email.');
      else if (status === 400) setError('Email and password are required.');
      else setError('An unexpected error occurred. Please try again.'); // For 500 or network errors
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Login to GueSpy"
        onSubmit={handleSubmit}
        error={error}
        footerText="Don't have an account?"
        footerLink="/register"
        footerLinkText="Register"
      >
        <div className="form-group">
          <InputField name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <InputField name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
        </div>
        <Button
          type="submit"
          disabled={
            loading || !formData.email || !formData.password
          }
        >{loading ? 'Logging in...' : 'Login'}</Button>
      </AuthForm>
    </AuthLayout>
  );
};

export default LoginPage;