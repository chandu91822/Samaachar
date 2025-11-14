import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      // ✅ SAVE TOKEN AND ROLE
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("username", data.username);

      console.log("Saved token:", localStorage.getItem("token"));

      // ✅ Delay to ensure token is stored
      // ✅ Delay to ensure token is stored
setTimeout(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Token not saved. Try login again.");
    return;
  }

  switch (data.role) {
    case "delivery": nav("/delivery"); break;
    case "cse": nav("/cse"); break;
    case "manager": nav("/manager"); break;
    case "customer": nav("/customer"); break;
    case "subscription": nav("/subscription"); break;
    default: nav("/subscription");
  }
}, 300);





    } catch (error) {
      console.error(error);
      alert("Something went wrong");
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
      <Typography variant="h5" sx={{ fontWeight: 800, textAlign: "center", marginBottom: 3 }}>
        Login
      </Typography>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "15px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "15px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />

      <Button
        variant="contained"
        fullWidth
        sx={{
          paddingY: 1.6,
          borderRadius: "12px",
          background: "#6a5acd",
          fontSize: "17px",
          fontWeight: 600,
          "&:hover": { background: "#7a6df5" },
          marginBottom: "18px",
        }}
        onClick={handleLogin}
      >
        Login
      </Button>

      <Button
        variant="outlined"
        fullWidth
        sx={{
          paddingY: 1.4,
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 600,
          borderColor: "#6a5acd",
          color: "#6a5acd",
          "&:hover": {
            borderColor: "#7a6df5",
            color: "#7a6df5",
            backgroundColor: "#f3f0ff",
          },
        }}
        onClick={() => nav("/register")}
      >
        Register Here
      </Button>
    </Box>
  );
}
