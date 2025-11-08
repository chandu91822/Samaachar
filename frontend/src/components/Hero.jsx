import React from "react";
import { Box, Typography, Button } from "@mui/material";

export default function Hero({ onGetStarted }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        padding: "110px 20px",
        background: "linear-gradient(to bottom, #0d0d0d, #1a1a1a, #232323)",
        color: "#fff",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: "900",
          marginBottom: 2,
          background: "linear-gradient(45deg,#ffdd44,#ffffff)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          animation: "fadeIn 1.5s ease-out",
        }}
      >
        Samaachar Automation Software
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: "#dcdcdc",
          marginBottom: 4,
          animation: "fadeIn 2.2s ease-out",
        }}
      >
        Modern newspaper management with automation, accuracy & real-time insights.
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={onGetStarted}
        sx={{
          padding: "12px 35px",
          fontSize: "18px",
          borderRadius: "30px",
          background: "linear-gradient(45deg, #ffdd44, #e6b800)",
          color: "#111",
          fontWeight: "600",
          boxShadow: "0 5px 15px rgba(0,0,0,0.4)",
          transition: "0.3s",
          "&:hover": {
            transform: "scale(1.08)",
            background: "linear-gradient(45deg, #ffe980, #ffcc00)",
          },
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}
