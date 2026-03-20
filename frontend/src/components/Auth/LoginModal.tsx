import React, { useState } from 'react';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading states
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoginLoading(true);
    
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.access_token);
        onClose();
        window.location.href = '/dashboard'; // Redirect to dashboard
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsForgotPasswordLoading(true);

    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      setIsForgotPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD_SEND_OTP, {
        method: 'POST',
        ...fetchOptions,
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setSuccess('OTP sent successfully to your email');
        setError('');
      } else {
        setError(data.detail || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsForgotPasswordLoading(true);

    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setIsForgotPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsForgotPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsForgotPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD_VERIFY_OTP, {
        method: 'POST',
        ...fetchOptions,
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: otp,
          new_password: newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        // Reset form and go back to login
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpSent(false);
        setError('');
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
        <div className="mt-3">
          {!showForgotPassword ? (
            // Login Form
            <>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">Welcome Back</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    disabled={isLoginLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    disabled={isLoginLoading}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    disabled={isLoginLoading}
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500 disabled:text-blue-400 disabled:cursor-not-allowed"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    disabled={isLoginLoading}
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoginLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                  >
                    {isLoginLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            // Forgot Password Form
            <>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                {!otpSent ? 'Reset Password' : 'Enter OTP'}
              </h3>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              
              {!otpSent ? (
                // Email Form
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={isForgotPasswordLoading}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your registered email"
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      type="button"
                      disabled={isForgotPasswordLoading}
                      onClick={resetForgotPasswordForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotPasswordLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                    >
                      {isForgotPasswordLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // OTP and New Password Form
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      disabled={isForgotPasswordLoading}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      OTP sent to {forgotPasswordEmail}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      required
                      disabled={isForgotPasswordLoading}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      disabled={isForgotPasswordLoading}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      type="button"
                      disabled={isForgotPasswordLoading}
                      onClick={resetForgotPasswordForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotPasswordLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    >
                      {isForgotPasswordLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 