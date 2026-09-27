import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FaPaperPlane } from 'react-icons/fa';
import { apiFetch } from "../api";
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Contact] Submitting form...', formData);
    
    setLoading(s => true);

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      console.log('[Contact] Server response:', result);

      if (result.success) {
        toast.success('Your message has been sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error('Something went wrong: ' + (result.message || 'Please try again.'));
      }
    } catch (error) {
      console.error('[Contact] Error submitting form:', error);
      toast.error('Could not connect to the server.');
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
              className="contact-input contact-textarea"
            />
          </div>
          
          <button type="submit" disabled={loading} className="contact-submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FaPaperPlane /> {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Contact;