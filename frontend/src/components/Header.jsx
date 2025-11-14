import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";

export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar
      position="sticky"
      sx={{
        background: "rgba(20,20,20,0.85)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      }}
    >
      <Toolbar sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <NewspaperIcon
            sx={{ fontSize: 40, marginRight: 1, color: "#ffdd44" }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "900",
              letterSpacing: "1px",
              background: "linear-gradient(45deg,#fff,#ffdf6b)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Samaachar
          </Typography>
        </Box>

        <Button
          color="inherit"
          onClick={handleMenu}
          sx={{
            fontSize: "16px",
            textTransform: "none",
            "&:hover": {
              color: "#ffdd44",
              transform: "scale(1.03)",
              transition: "0.3s",
            },
          }}
        >
          Features ▾
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              padding: "5px 0",
              borderRadius: "12px",
              background: "#222",
              color: "#eee",
            },
          }}
        >
          {[
            "Manager Dashboard",
            "Customer Portal",
            "Delivery Tracking",
            "Subscription Plans",
            "Customer Support",
          ].map((item) => (
            <MenuItem
              key={item}
              onClick={handleClose}
              sx={{
                "&:hover": {
                  background: "#333",
                  color: "#ffdd44",
                },
              }}
            >
              {item}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
