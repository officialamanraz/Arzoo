import React, { useState } from 'react';
import { apiFetch } from "../api";

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Sending your message...');

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        setStatus('Your message has been sent! 🚀');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('Something went wrong: ' + result.message);
      }
    } catch (error) {
      console.error(error);
      setStatus('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-wrapper">
      <div className="contact-card">
        
        <div className="contact-header">
          <h2>Get in Touch</h2>
          <p>We'd love to hear from you. Send us a message!</p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              name="name" 
              placeholder="Enter your name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="contact-input"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="contact-input"
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea 
              name="message" 
              placeholder="How can we help you?" 
              value={formData.message} 
              onChange={handleChange} 
              required 
              className="contact-input"
            />
          </div>
          
          <button type="submit" disabled={loading} className="contact-submit-btn">
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        
        {status && (
          <div className={`status-message ${status.includes('sent') ? 'status-success' : 'status-error'}`}>
            {status}
          </div>
        )}

      </div>
    </div>
  );
};

export default Contact;