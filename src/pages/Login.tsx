import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/auth';
import Input from '../components/forms/Input';
import Button from '../components/forms/Button';
import { LogIn } from 'lucide-react';

declare global {
  interface Window {
    gapi: any;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  // Google sign-in state
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/');
    },
    onError: (error: any) => {
      setErrors({
        submit: error.response?.data?.message || 'Login failed. Please try again.',
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  const handleGoogleSignIn = async (googleData: any) => {
    try {
      const idToken = googleData.tokenId;

      // Send the ID token to your server to verify and get user data
      const response = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      setUser(data.user);
      navigate('/');
    } catch (error) {
      setGoogleError('Google Sign-In failed. Please try again.');
      console.error('Google Sign-In error:', error);
    }
  };

  // Load Google API client
  useEffect(() => {
    window.gapi.load('auth2', () => {
      const auth2 = window.gapi.auth2.init({
        client_id: '309222170594-80tfthgu4i0s7iub3t9ojqgi3dctcbla.apps.googleusercontent.com', // Replaced with your Google Client ID
      });

      // Automatically render the Google Sign-In button
      window.gapi.signin2.render('google-signin-btn', {
        scope: 'profile email',
        longtitle: true,
        theme: 'dark',
        onsuccess: handleGoogleSignIn,
        onfailure: (error: any) => {
          setGoogleError('Google Sign-In failed. Please try again.');
          console.error('Google Sign-In error:', error);
        },
      });
    });
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={loginMutation.isPending}
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              disabled={loginMutation.isPending}
            />
          </div>

          {errors.submit && (
            <div className="text-sm text-red-600 text-center">
              {errors.submit}
            </div>
          )}

          {googleError && (
            <div className="text-sm text-red-600 text-center">
              {googleError}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            Sign in
          </Button>

          <div className="text-sm text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-4 flex justify-center">
            <div id="google-signin-btn"></div> {/* This div will automatically display the Google button */}
          </div>
        </form>
      </div>
    </div>
  );
}
