import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Button,
  Box,
  Paper,
  Grid,
} from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import "./App.css";

// ✅ Correct imports (you said Login/Register are in components)
import Login from "./components/Login";
import Register from "./components/Register";

// ✅ Dashboards (in pages folder)
import ManagerDashboard from "./pages/ManagerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import CustomerServiceDashboard from "./pages/CustomerServiceDashboard";
import SubscriptionManagerDashboard from "./pages/SubscriptionManagerDashboard";


// ✅ HOME PAGE
function HomePage() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "linear-gradient(to bottom right, #eef2ff, #dde1f7)",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "#ffffffd9",
          backdropFilter: "blur(30px)",
          borderBottom: "1px solid #e6e6e6",
        }}
      >
        <Toolbar sx={{ paddingY: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <NewspaperIcon
              sx={{ fontSize: 38, color: "#5a5a5a", marginRight: 1 }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#333",
                letterSpacing: "0.8px",
              }}
            >
              Samaachar
            </Typography>
          </Box>

          <Button
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              color: "#444",
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 500,
              "&:hover": { color: "#111" },
            }}
          >
            Features ▾
          </Button>

          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            <MenuItem>Manager Dashboard</MenuItem>
            <MenuItem>Customer Portal</MenuItem>
            <MenuItem>Delivery Tracking</MenuItem>
            <MenuItem>Subscription Plans</MenuItem>
            <MenuItem>Customer Support</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* HERO SECTION */}
      <Box
        sx={{
          textAlign: "center",
          padding: "120px 20px",
          background: "linear-gradient(to bottom, #ffffff, #dbe4ff)",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            marginBottom: 2,
            color: "#222",
            letterSpacing: "1px",
          }}
        >
          Samaachar Automation Software
        </Typography>

        <Typography variant="h6" sx={{ color: "#555", marginBottom: 4 }}>
          Manage newspapers, subscriptions, deliveries & more.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/login")}
          sx={{
            padding: "12px 35px",
            fontSize: "18px",
            borderRadius: "30px",
            fontWeight: 600,
            background: "#6a5acd",
            "&:hover": { background: "#7b6df0" },
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          Get Started
        </Button>
      </Box>

      {/* FEATURES */}
      <Box sx={{ padding: "70px 20px" }}>
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: 800,
            marginBottom: 4,
            color: "#2d2d2d",
          }}
        >
          What Samaachar Offers
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {[
            ["Multi-role System", "Manager, Customer, Delivery Boy & more"],
            ["Automation First", "Paperless & digital workflow"],
            ["Live Delivery Tracking", "Real-time updates for users"],
            ["Smart Subscriptions", "Add / update / remove plans easily"],
          ].map(([title, desc]) => (
            <Grid item xs={12} md={3} key={title}>
              <Paper
                elevation={0}
                sx={{
                  padding: 4,
                  borderRadius: "18px",
                  background: "#ffffffcc",
                  backdropFilter: "blur(12px)",
                  textAlign: "center",
                  border: "1px solid #eee",
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {title}
                </Typography>
                <Typography sx={{ marginTop: 1, color: "#555" }}>
                  {desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          padding: 3,
          background: "#fafafa",
          color: "#666",
          textAlign: "center",
          borderTop: "1px solid #eaeaea",
        }}
      >
        <Typography>© 2025 Samaachar • All Rights Reserved</Typography>
      </Box>
    </div>
  );
}


// ✅ MAIN APP (Router)
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Home */}
        <Route path="/" element={<HomePage />} />

        {/* ✅ Login & Register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Dashboards */}
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/delivery" element={<DeliveryDashboard />} />
        <Route path="/cse" element={<CustomerServiceDashboard />} />
        <Route path="/subscription" element={<SubscriptionManagerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
