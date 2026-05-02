import React, { useState } from "react";

const AddCustomerForm = ({ onCustomerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    state: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number - must be exactly 10 digits
    if (!formData.phone || formData.phone.length !== 10) {
      alert("❌ Phone number must be exactly 10 digits");
      return;
    }
    
    try {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const response = await fetch(`${base.replace(/\/$/, '')}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Customer added successfully!");
        setFormData({ name: '', email: '', phone: '', address: '', state: '' });
        if (onCustomerAdded) onCustomerAdded();
      } else {
        alert("Failed to add customer.");
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Error connecting to server.");
    }
  };

  const handleChange = (e) => {
    let value = e.target.value;
    // Restrict phone field to exactly 10 digits
    if (e.target.name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
   <div className="add-form">
  <h2>Add Customer</h2>
  <form onSubmit={handleSubmit}>
    <div className="form-row">
      <div className="form-group">
        <label>Full Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Phone Number:</label>
        <input 
          type="tel" 
          name="phone" 
          placeholder="Enter 10 digit phone number"
          value={formData.phone} 
          onChange={handleChange} 
          maxLength="10"
          required 
        />
        <small style={{ display: 'block', marginTop: '4px', color: formData.phone.length === 10 ? '#16a34a' : '#666', fontWeight: formData.phone.length === 10 ? 'bold' : 'normal' }}>
          {formData.phone.length}/10 digits
        </small>
      </div>

      <div className="form-group">
        <label>Address:</label>
        <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
      </div>

      <div className="form-group">
        <label>State:</label>
        <input type="text" name="state" value={formData.state} onChange={handleChange} required />
      </div>
    </div>

    <button type="submit" className="submit-button">Add Customer</button>
  </form>
</div>


  );
};
export default AddCustomerForm;