import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        marginTop: 5,
        padding: "25px",
        background: "#111",
        color: "#bbb",
        textAlign: "center",
        borderTop: "1px solid #333",
      }}
    >
      <Typography sx={{ letterSpacing: "1px" }}>
        © 2025 Samaachar • Automation Software • All Rights Reserved
      </Typography>
    </Box>
  );
}
