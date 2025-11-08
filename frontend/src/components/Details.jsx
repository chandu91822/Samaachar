import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";

export default function Details() {
  const facts = [
    ["Multi-role System", "Manager, Customer, Delivery Boy & more"],
    ["Automation First", "No paperwork, 100% digital workflow"],
    ["Live Delivery Tracking", "Real-time updates for customers"],
    ["Smart Subscriptions", "Easy add / update / remove plans"],
  ];

  return (
    <Box
      sx={{
        padding: "70px 20px",
        background: "#f5f5f5",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: "900",
          marginBottom: 4,
          textAlign: "center",
          color: "#222",
        }}
      >
        Project Features & Highlights
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {facts.map(([title, desc]) => (
          <Grid item xs={12} md={3} key={title}>
            <Paper
              elevation={5}
              sx={{
                padding: 4,
                textAlign: "center",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: "700", marginBottom: 1 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: "#444" }}>
                {desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
