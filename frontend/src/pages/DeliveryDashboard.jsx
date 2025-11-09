import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Snackbar, Alert
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const API = "http://127.0.0.1:8000/api";

export default function DeliveryDashboard() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/login";

  const authHeaders = { Authorization: `Bearer ${token}` };

  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });

  const notify = (msg, severity = "success") => setSnack({ open: true, severity, msg });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/delivery/today/summary/`, { headers: authHeaders });

      if (res.status === 401) {
        alert("Session expired. Login again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      // Sort by sequence number
      const sortedData = Array.isArray(data) 
        ? data.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
        : [];
      setDeliveries(sortedData);

      // Load stats
      const statsRes = await fetch(`${API}/delivery/stats/`, { headers: authHeaders });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading delivery data:", error);
      notify("Failed to load delivery data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const markDelivered = async (id) => {
    try {
      const r = await fetch(`${API}/delivery/mark/${id}/`, {
        method: "POST",
        headers: authHeaders,
      });

      if (r.ok) {
        const data = await r.json();
        notify(`Delivered! Commission: ₹${data.commission?.toFixed(2) || 0}`, "success");
        loadData();
      } else {
        const error = await r.json().catch(() => ({}));
        notify(error?.error || "Failed to mark as delivered", "error");
      }
    } catch (error) {
      console.error("Error marking delivered:", error);
      notify("Failed to mark as delivered", "error");
    }
  };

  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const totalCommission = deliveries
    .filter(d => d.status === "delivered")
    .reduce((sum, d) => sum + (parseFloat(d.commission) || 0), 0);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef2ff", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <LocalShippingIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Delivery Dashboard
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: "16px", p: 2, bgcolor: "#fff" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>Total Deliveries</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {deliveries.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: "16px", p: 2, bgcolor: "#fff" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>Pending</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "warning.main" }}>
                {pendingCount}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: "16px", p: 2, bgcolor: "#fff" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>Delivered</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "success.main" }}>
                {deliveredCount}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: "16px", p: 2, bgcolor: "#fff" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>Today's Commission</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "primary.main" }}>
                ₹{totalCommission.toFixed(2)}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Overall Stats */}
        {stats && (
          <Paper sx={{ p: 2, borderRadius: "16px", mb: 3, bgcolor: "#fff" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Overall Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ color: "#666" }}>Total Deliveries</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stats.total_deliveries || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" sx={{ color: "#666" }}>Total Commission</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                  ₹{parseFloat(stats.total_commission || 0).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Delivery Route */}
        <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "#fff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Today's Delivery Route
            </Typography>
            <Button variant="outlined" onClick={loadData} disabled={loading}>
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Typography sx={{ py: 4, textAlign: "center" }}>Loading...</Typography>
          ) : deliveries.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", color: "#666" }}>
              No deliveries assigned for today.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>House #</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell><strong>Publications</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.map((delivery, index) => (
                  <TableRow 
                    key={delivery.id} 
                    sx={{ 
                      "&:hover": { bgcolor: "#f5f5f5" },
                      bgcolor: delivery.status === "delivered" ? "#f0f8f0" : "inherit"
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {delivery.house_number || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{delivery.customer_name || "Unknown"}</TableCell>
                    <TableCell>{delivery.address_line || "-"}</TableCell>
                    <TableCell>
                      {Array.isArray(delivery.publications) 
                        ? delivery.publications.join(", ") || "None"
                        : delivery.publications || "None"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={delivery.status || "pending"}
                        color={delivery.status === "delivered" ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {delivery.status !== "delivered" ? (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => markDelivered(delivery.id)}
                        >
                          Mark Delivered
                        </Button>
                      ) : (
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                          ✓ Delivered
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
