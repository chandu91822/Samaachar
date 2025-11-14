// src/pages/dashboards/CseDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Paper, Table, TableHead, TableRow,
  TableCell, TableBody, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const API = "http://127.0.0.1:8000/api";

export default function CseDashboard() {
  const [rows, setRows] = useState([]);
  const [replyOpen, setReplyOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [reply, setReply] = useState("");

  // ✅ Detect whether to use Bearer or Token
  const token = localStorage.getItem("token");
  const auth = {
    Authorization: token.startsWith("ey") ? `Bearer ${token}` : `Token ${token}`
  };

  const load = async () => {
    try {
      const r = await fetch(`${API}/cse/complaints/`, { headers: auth });
      const data = await r.json();

      if (Array.isArray(data)) {
        setRows(data);
      } else {
        console.error("API did not return an array:", data);
        setRows([]); // prevent .map crash
      }
    } catch (err) {
      console.error("Load error:", err);
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    const r = await fetch(`${API}/cse/complaints/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ status })
    });

    if (r.ok) load();
    else alert("Failed");
  };

  const sendReply = async () => {
    const r = await fetch(`${API}/cse/complaints/${currentId}/reply/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ reply })
    });

    if (r.ok) {
      setReplyOpen(false);
      setReply("");
      load();
    } else alert("Failed");
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#eef2ff" }}>
      <AppBar sx={{ background: "#fff", color: "#222" }} elevation={1}>
        <Toolbar>
          <SupportAgentIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
            Customer Service – Complaints
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, borderRadius: "16px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.customer_name}</TableCell>
                  <TableCell>{r.message}</TableCell>
                  <TableCell>{r.created_at}</TableCell>

                  <TableCell>
                    <Chip
                      label={r.status}
                      color={
                        r.status === "open"
                          ? "default"
                          : r.status === "in_progress"
                          ? "warning"
                          : "success"
                      }
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Button sx={{ mr: 1 }} onClick={() => setStatus(r.id, "in_progress")}>
                      In-Progress
                    </Button>

                    <Button
                      sx={{ mr: 1 }}
                      variant="contained"
                      onClick={() => {
                        setCurrentId(r.id);
                        setReplyOpen(true);
                      }}
                    >
                      Reply
                    </Button>

                    <Button
                      color="success"
                      variant="outlined"
                      onClick={() => setStatus(r.id, "closed")}
                    >
                      Close
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </Paper>
      </Box>

      <Dialog open={replyOpen} onClose={() => setReplyOpen(false)}>
        <DialogTitle>Send Reply</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reply"
            multiline
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendReply}>Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
