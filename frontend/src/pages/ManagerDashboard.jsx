// src/pages/dashboards/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  AppBar, Toolbar, Typography, Box, Grid, Paper, Button, 
  Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
  Snackbar, Alert
} from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";

const API = "http://127.0.0.1:8000/api";

export default function ManagerDashboard(){
  const [stats, setStats] = useState({ customers:0, subscriptions:0 });
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tab, setTab] = useState(0);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
  
  const auth = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const notify = (msg, severity = "success") => setSnack({ open: true, severity, msg });

  const load = async()=>{
    const r = await fetch(`${API}/manager/stats/`, { headers: auth });
    setStats(await r.json());
  };

  const loadCustomers = async()=>{
    try {
      const r = await fetch(`${API}/manager/customers/`, { headers: auth });
      setCustomers(await r.json());
    } catch (e) {
      notify("Failed to load customers", "error");
    }
  };

  const loadSubscriptions = async()=>{
    try {
      const r = await fetch(`${API}/manager/subscriptions/`, { headers: auth });
      setSubscriptions(await r.json());
    } catch (e) {
      notify("Failed to load subscriptions", "error");
    }
  };


  useEffect(()=>{ 
    load(); 
    loadCustomers();
    loadSubscriptions();
  },[]);

  return (
    <Box sx={{ minHeight:"100vh", background:"linear-gradient(to bottom right,#eef2ff,#d7dbff)" }}>
      <AppBar position="sticky" elevation={0} sx={{ background:"#fff", color:"#222" }}>
        <Toolbar>
          <NewspaperIcon sx={{ mr:1 }} />
          <Typography variant="h5" sx={{ fontWeight:800, flexGrow:1 }}>Manager Panel</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p:4, maxWidth: 1400, mx: "auto" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p:3, textAlign:"center", borderRadius:"16px" }}>
              <Typography variant="h6">Total Customers</Typography>
              <Typography variant="h4" sx={{ mt:1, fontWeight:900 }}>{stats.customers}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p:3, textAlign:"center", borderRadius:"16px" }}>
              <Typography variant="h6">Active Subscriptions</Typography>
              <Typography variant="h4" sx={{ mt:1, fontWeight:900 }}>{stats.subscriptions}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, mb: 2 }}>
          <Tab label="All Customers" />
          <Tab label="All Subscriptions" />
        </Tabs>

        {/* All Customers Tab */}
        {tab === 0 && (
          <Paper sx={{ p: 3, borderRadius: "16px", mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>All Customers</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Username</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.username}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.address || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No customers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* All Subscriptions Tab */}
        {tab === 1 && (
          <Paper sx={{ p: 3, borderRadius: "16px", mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>All Subscriptions</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Plan</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Start Date</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.length > 0 ? (
                  subscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.id}</TableCell>
                      <TableCell>{s.customer_name}</TableCell>
                      <TableCell>{s.plan_title}</TableCell>
                      <TableCell>{s.status}</TableCell>
                      <TableCell>{s.start_date}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No subscriptions found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={3000} 
        onClose={() => setSnack({...snack, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnack({...snack, open: false})} 
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
