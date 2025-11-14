import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    house_number: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/accounts/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Registration failed");
        return;
      }

      alert("✅ Registration successful!");
      navigate("/login");
    } catch (error) {
      alert("Something went wrong!");
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "420px",
        margin: "120px auto",
        padding: "35px",
        borderRadius: "16px",
        background: "#ffffffee",
        border: "1px solid #dfe3f0",
        boxShadow: "0 6px 28px rgba(0,0,0,0.12)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, textAlign: "center", marginBottom: 3 }}
      >
        Register
      </Typography>

      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        style={styles.input}
      />

      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        style={styles.input}
      >
        <option value="">Select Role</option>
        <option value="manager">Manager</option>
        <option value="customer">Customer</option>
        <option value="delivery">Delivery Person</option>
        <option value="cse">Customer Service Executive</option>
        <option value="sm">Subscription Manager</option>
      </select>

      {form.role === "customer" && (
        <input
          name="house_number"
          placeholder="House Number (required for customers)"
          value={form.house_number}
          onChange={handleChange}
          style={styles.input}
          required
        />
      )}


      <Button
        fullWidth
        variant="contained"
        sx={styles.button}
        onClick={handleRegister}
      >
        Register
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={styles.outlineButton}
        onClick={() => navigate("/login")}
      >
        Back to Login
      </Button>
    </Box>
  );
}

const styles = {
  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    paddingY: 1.6,
    borderRadius: "12px",
    background: "#6a5acd",
    fontSize: "17px",
    fontWeight: 600,
    marginBottom: "18px",
  },
  outlineButton: {
    paddingY: 1.4,
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    borderColor: "#6a5acd",
    color: "#6a5acd",
  },
};
