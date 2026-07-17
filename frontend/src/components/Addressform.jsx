import React, { useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;


function AddressForm() {
  const navigate = useNavigate();
const location = useLocation();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    pincode: '',
    state: '',
    city: '',
    houseNo: '',
    roadArea: '',
    landmark: ''
  });

  const [showAlternatePhone, setShowAlternatePhone] = useState(false);
  const [showLandmark, setShowLandmark] = useState(false);
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Auto-fill State + City from the pincode using India Post's public API (no API key, no hardcoded data)
  const handlePincodeBlur = async () => {
    if (form.pincode.length !== 6) return;

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
      const data = await res.json();

      if (data[0]?.Status === 'Success') {
        const office = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          state: office.State,
          city: office.District
        }));
      }
    } catch (err) {
      console.error('Pincode lookup failed:', err);
    }
  };

  // Use browser geolocation + OpenStreetMap's free reverse-geocoding to auto-fill the address
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location access is not supported on this browser.');
      return;
    }

    setLocating(true);
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data.address || {};

          setForm((prev) => ({
            ...prev,
            pincode: addr.postcode || prev.pincode,
            state: addr.state || prev.state,
            city: addr.city || addr.town || addr.village || prev.city,
            roadArea: addr.road || prev.roadArea
          }));
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocationMessage('Could not fetch address for your location. Please fill manually.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationMessage('Please provide location permission to auto-fill your address.');
      }
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Please provide the necessary details.';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit phone number.';
    if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    if (!form.state.trim()) newErrors.state = 'State is required.';
    if (!form.city.trim()) newErrors.city = 'City is required.';
    if (!form.houseNo.trim()) newErrors.houseNo = 'House No. / Building Name is required.';
    if (!form.roadArea.trim()) newErrors.roadArea = 'Road name / Area / Colony is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
const buyNowProduct = location.state?.buyNowProduct;
  const handleSaveAddress = async () => {
    if (!validate()) return;
    setSaving(true);
    setSubmitError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.success) {
        console.log(data);
        // 4. MAIN CHANGE: Yahan addressId ke sath-sath buyNowProduct ko bhi aage bhej do
        navigate('/order-summary', { 
          state: { 
            addressId: data.addressId,
            buyNowProduct: buyNowProduct // Carrying the baggage forward!
          } 
        });
      } else {
        setSubmitError(data.message || 'Could not save address.');
      }
    } catch (err) {
      console.error('Save address error:', err);
      setSubmitError('Something went wrong while saving your address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 24px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer' }}
          >
            ←
          </button>
          <h2 style={{ margin: 0, color: '#333' }}>Add delivery address</h2>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
          <Step number={1} label="Address" active />
          <StepLine />
          <Step number={2} label="Order Summary" />
          <StepLine />
          <Step number={3} label="Payment" />
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '700px', margin: '24px auto', background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        <FieldInput
          name="fullName"
          placeholder="Full Name (Required)*"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />

        <FieldInput
          name="phone"
          placeholder="Phone number (Required)*"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          type="tel"
          maxLength={10}
        />

        {!showAlternatePhone ? (
          <button
            type="button"
            onClick={() => setShowAlternatePhone(true)}
            style={linkButtonStyle}
          >
            + Add Alternate Phone Number
          </button>
        ) : (
          <FieldInput
            name="alternatePhone"
            placeholder="Alternate Phone Number"
            value={form.alternatePhone}
            onChange={handleChange}
            type="tel"
            maxLength={10}
          />
        )}

        {locationMessage && (
          <p style={{ color: '#c0392b', fontSize: '0.85em', margin: '16px 0 4px' }}>{locationMessage}</p>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <FieldInput
              name="pincode"
              placeholder="Pincode (Required)*"
              value={form.pincode}
              onChange={handleChange}
              onBlur={handlePincodeBlur}
              error={errors.pincode}
              maxLength={6}
            />
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            style={useLocationButtonStyle}
          >
            {locating ? 'Locating...' : '📍 Use my location'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <div style={{ flex: 1 }}>
            <FieldInput
              name="state"
              placeholder="State (Required)*"
              value={form.state}                                                                                                                                                                                                                                                                                                                                                                                                                                                       
              onChange={handleChange}
              error={errors.state}
            />
          </div>
          <div style={{ flex: 1 }}>
            <FieldInput
              name="city"
              placeholder="City (Required)*"
              value={form.city}
              onChange={handleChange}
              error={errors.city}
            />
          </div>
        </div>

        <FieldInput
          name="houseNo"
          placeholder="House No., Building Name (Required)*"
          value={form.houseNo}
          onChange={handleChange}
          error={errors.houseNo}
        />

        <FieldInput
          name="roadArea"
          placeholder="Road name, Area, Colony (Required)*"
          value={form.roadArea}
          onChange={handleChange}
          error={errors.roadArea}
        />

        {!showLandmark ? (
          <button type="button" onClick={() => setShowLandmark(true)} style={linkButtonStyle}>
            + Add Nearby Famous Shop/Mall/Landmark
          </button>
        ) : (
          <FieldInput
            name="landmark"
            placeholder="Nearby Landmark"
            value={form.landmark}
            onChange={handleChange}
          />
        )}

        {submitError && (
          <p style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '8px', fontSize: '0.9em', marginTop: '16px' }}>
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSaveAddress}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '24px',
            backgroundColor: saving ? '#c98a2c99' : '#A8325E',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '1em',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Deliver Here'}
        </button>
      </div>
    </div>
  );
}

// ---------- Small building-block components ----------

function Step({ number, label, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? '#2874f0' : '#e0e0e0',
          color: active ? '#fff' : '#888',
          fontWeight: 'bold'
        }}
      >
        {number}
      </div>
      <span style={{ marginTop: '6px', fontSize: '0.85em', color: active ? '#333' : '#999' }}>{label}</span>
    </div>
  );
}

function StepLine() {
  return <div style={{ width: '80px', height: '2px', backgroundColor: '#e0e0e0', marginBottom: '20px' }} />;
}

function FieldInput({ name, placeholder, value, onChange, onBlur, error, type = 'text', maxLength }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '8px',
          border: error ? '1px solid #c0392b' : '1px solid #ddd',
          fontSize: '0.95em',
          boxSizing: 'border-box'
        }}
      />
      {error && <p style={{ color: '#c0392b', fontSize: '0.8em', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#2874f0',
  cursor: 'pointer',
  fontSize: '0.9em',
  padding: 0,
  marginBottom: '16px',
  display: 'block'
};

const useLocationButtonStyle = {
  padding: '0 20px',
  backgroundColor: '#2874f0',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

export default AddressForm;