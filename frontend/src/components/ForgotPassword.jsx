import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-3.onrender.com';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'If that email exists, a reset link has been sent.');
      } else {
        setIsError(true);
        setMessage(data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setIsError(true);
      setMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '120px', textAlign: 'center', padding: '20px', minHeight: '60vh' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Forgot Password</h2>
      <p style={{ color: '#666', marginBottom: '20px', maxWidth: '350px', marginLeft: 'auto', marginRight: 'auto' }}>
        Enter your account email. We'll send you a link to reset your password.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}
      >
        {message && (
          <div
            style={{
              background: isError ? '#fdecea' : '#e6f4ea',
              color: isError ? '#b3261e' : '#1e7e34',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'left',
            }}
          >
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px',
            background: isSubmitting ? '#ffab8a' : '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          <Link to="/login" style={{ color: '#e07a5f', fontWeight: 'bold', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;