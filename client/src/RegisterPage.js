import React, { useState } from "react";
import axios from "axios";
import "./AuthPage.css";

const RegisterPage = ({ goToLogin, goToHome }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 3) {
      setError("Password must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {

      const response = await axios.post('http://localhost:5000/api/register', {
        name,
        email,
        password
      });
       alert(response.data.message);
      goToHome();
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };
      

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">CRM Registration</h2>

        {error && (
          <div style={{ 
            color: "red", 
            marginBottom: "10px",
            padding: "8px",
            backgroundColor: "#ffe6e6",
            borderRadius: "4px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />

          <input
            type="password"
            placeholder="Password (min 3 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <span onClick={goToLogin} style={{ cursor: "pointer", color: "blue" }}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;