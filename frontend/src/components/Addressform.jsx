import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AddressForm.css';

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

  const handlePincodeBlur = async () => {
    if (form.pincode.length !== 6) return;
    console.log(`[AddressForm] Looking up pincode: ${form.pincode}`);

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
      const data = await res.json();
      console.log('[AddressForm] Pincode response:', data);

      if (data[0]?.Status === 'Success') {
        const office = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          state: office.State,
          city: office.District
        }));
      }
    } catch (err) {
      console.error('[AddressForm] Pincode lookup failed:', err);
    }
  };

  const handleUseMyLocation = () => {
    console.log('[AddressForm] Attempting to get geolocation...');
    if (!navigator.geolocation) {
      setLocationMessage('Location access is not supported on this browser.');
      return;
    }

    setLocating(true);
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`[AddressForm] Geolocation success: lat ${latitude}, lon ${longitude}`);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          console.log('[AddressForm] Reverse geocoding response:', data);
          const addr = data.address || {};

          setForm((prev) => ({
            ...prev,
            pincode: addr.postcode || prev.pincode,
            state: addr.state || prev.state,
            city: addr.city || addr.town || addr.village || prev.city,
            roadArea: addr.road || prev.roadArea
          }));
        } catch (err) {
          console.error('[AddressForm] Reverse geocoding failed:', err);
          setLocationMessage('Could not fetch address for your location. Please fill manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('[AddressForm] Geolocation permission denied or failed.', err);
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
    console.log('[AddressForm] Submitting form data:', form);
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
      console.log('[AddressForm] Save address response:', data);

      if (data.success) {
        // Pass buyNowProduct along with the addressId forward
        navigate('/order-summary', { 
          state: { 
            addressId: data.addressId,
            buyNowProduct: buyNowProduct 
          } 
        });
      } else {
        setSubmitError(data.message || 'Could not save address.');
      }
    } catch (err) {
      console.error('[AddressForm] Save address error:', err);
      setSubmitError('Something went wrong while saving your address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="address-page">
      {/* Header */}
      <div className="address-header">
        <div className="header-inner">
          <button onClick={() => navigate(-1)} className="back-btn">←</button>
          <h2>Add delivery address</h2>
        </div>

        {/* Stepper */}
        <div className="stepper-container">
          <Step number={1} label="Address" active />
          <StepLine />
          <Step number={2} label="Order Summary" />
          <StepLine />
          <Step number={3} label="Payment" />
        </div>
      </div>

      {/* Form */}
      <div className="address-form-container">
        <FieldInput name="fullName" placeholder="Full Name (Required)*" value={form.fullName} onChange={handleChange} error={errors.fullName} />
        <FieldInput name="phone" placeholder="Phone number (Required)*" value={form.phone} onChange={handleChange} error={errors.phone} type="tel" maxLength={10} />

        {!showAlternatePhone ? (
          <button type="button" onClick={() => setShowAlternatePhone(true)} className="link-btn">
            + Add Alternate Phone Number
          </button>
        ) : (
          <FieldInput name="alternatePhone" placeholder="Alternate Phone Number" value={form.alternatePhone} onChange={handleChange} type="tel" maxLength={10} />
        )}

        {locationMessage && <p className="error-text">{locationMessage}</p>}

        <div className="form-row">
          <div className="flex-1">
            <FieldInput name="pincode" placeholder="Pincode (Required)*" value={form.pincode} onChange={handleChange} onBlur={handlePincodeBlur} error={errors.pincode} maxLength={6} />
          </div>
          <button type="button" onClick={handleUseMyLocation} disabled={locating} className="location-btn">
            {locating ? 'Locating...' : '📍 Use my location'}
          </button>
        </div>

        <div className="form-row">
          <div className="flex-1">
            <FieldInput name="state" placeholder="State (Required)*" value={form.state} onChange={handleChange} error={errors.state} />
          </div>
          <div className="flex-1">
            <FieldInput name="city" placeholder="City (Required)*" value={form.city} onChange={handleChange} error={errors.city} />
          </div>
        </div>

        <FieldInput name="houseNo" placeholder="House No., Building Name (Required)*" value={form.houseNo} onChange={handleChange} error={errors.houseNo} />
        <FieldInput name="roadArea" placeholder="Road name, Area, Colony (Required)*" value={form.roadArea} onChange={handleChange} error={errors.roadArea} />

        {!showLandmark ? (
          <button type="button" onClick={() => setShowLandmark(true)} className="link-btn">
            + Add Nearby Famous Shop/Mall/Landmark
          </button>
        ) : (
          <FieldInput name="landmark" placeholder="Nearby Landmark" value={form.landmark} onChange={handleChange} />
        )}

        {submitError && <p className="submit-error-box">{submitError}</p>}

        <button type="button" onClick={handleSaveAddress} disabled={saving} className="submit-btn">
          {saving ? 'Saving...' : 'Deliver Here'}
        </button>
      </div>
    </div>
  );
}

// Subcomponents
function Step({ number, label, active }) {
  return (
    <div className="step-wrapper">
      <div className={`step-circle ${active ? 'active' : ''}`}>{number}</div>
      <span className={`step-label ${active ? 'active' : ''}`}>{label}</span>
    </div>
  );
}

function StepLine() {
  return <div className="step-line" />;
}

function FieldInput({ name, placeholder, value, onChange, onBlur, error, type = 'text', maxLength }) {
  return (
    <div className="input-group">
      <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} maxLength={maxLength} className={`form-input ${error ? 'input-error' : ''}`} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default AddressForm;