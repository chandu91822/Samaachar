// src/pages/dashboards/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Box, Grid, Paper, Button } from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";
const API = "http://127.0.0.1:8000/api";

export default function ManagerDashboard(){
  const [stats, setStats] = useState({ customers:0, subscriptions:0, delivery_persons:0, dues:0 });
  const auth = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const load = async()=>{
    const r = await fetch(`${API}/manager/stats/`, { headers: auth });
    setStats(await r.json());
  };
  useEffect(()=>{ load(); },[]);

  return (
    <Box sx={{ minHeight:"100vh", background:"linear-gradient(to bottom right,#eef2ff,#d7dbff)" }}>
      <AppBar position="sticky" elevation={0} sx={{ background:"#fff", color:"#222" }}>
        <Toolbar>
          <NewspaperIcon sx={{ mr:1 }} />
          <Typography variant="h5" sx={{ fontWeight:800, flexGrow:1 }}>Manager Panel</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p:4 }}>
        <Grid container spacing={3}>
          {[
            ["Total Customers", stats.customers],
            ["Active Subscriptions", stats.subscriptions],
            ["Delivery Persons", stats.delivery_persons],
            ["Outstanding Dues (₹)", stats.dues],
          ].map(([t,v])=>(
            <Grid item xs={12} md={3} key={t}>
              <Paper sx={{ p:3, textAlign:"center", borderRadius:"16px" }}>
                <Typography variant="h6">{t}</Typography>
                <Typography variant="h4" sx={{ mt:1, fontWeight:900 }}>{v}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt:2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p:3, borderRadius:"16px" }}>
              <Typography variant="h6">Monthly Billing</Typography>
              <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Auto-generate bills for all customers.</Typography>
              <Button sx={{ mt:2 }} variant="contained"
                onClick={async()=>{ const r=await fetch(`${API}/manager/generate-bills/`,{ method:"POST", headers:auth }); r.ok?alert("Bills generated"):alert("Failed"); }}>
                Generate Bills
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p:3, borderRadius:"16px" }}>
              <Typography variant="h6">Outstanding Dues</Typography>
              <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Send polite reminders & auto discontinue after 2 months.</Typography>
              <Button sx={{ mt:2 }} variant="contained"
                onClick={async()=>{ const r=await fetch(`${API}/manager/send-reminders/`,{ method:"POST", headers:auth }); r.ok?alert("Reminders queued"):alert("Failed"); }}>
                Send Reminders
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p:3, borderRadius:"16px" }}>
              <Typography variant="h6">Delivery Commission</Typography>
              <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Compute 2.5% commission per delivery person.</Typography>
              <Button sx={{ mt:2 }} variant="contained"
                onClick={async()=>{ const r=await fetch(`${API}/manager/compute-commission/`,{ method:"POST", headers:auth }); r.ok?alert("Commission computed"):alert("Failed"); }}>
                Compute Commission
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
