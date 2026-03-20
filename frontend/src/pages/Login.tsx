import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * The /login route redirects to home page where the real login modal exists.
 * This prevents the broken skeleton login form from being used.
 */
const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page — the real login modal lives there
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Login;