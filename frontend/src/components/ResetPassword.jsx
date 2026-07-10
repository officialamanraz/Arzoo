import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-3.onrender.com';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsError(true);
        setMessage(data.message || 'Reset failed. The link may have expired.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setIsError(true);
      setMessage('Could not reach the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '120px', textAlign: 'center', padding: '20px', minHeight: '60vh' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Reset Your Password</h2>

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
          type="password"
          placeholder="New Password (min. 6 characters)"
          minLength="6"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          minLength="6"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;