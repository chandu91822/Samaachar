// src/pages/dashboards/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  AppBar, Toolbar, Typography, Box, Grid, Paper, Button, 
  Table, TableHead, TableRow, TableCell, TableBody, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import PrintIcon from "@mui/icons-material/Print";

const API = "http://127.0.0.1:8000/api";

export default function ManagerDashboard(){
  const [stats, setStats] = useState({ customers:0, subscriptions:0, delivery_persons:0, dues:0 });
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [commissionReport, setCommissionReport] = useState(null);
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

  const loadDeliveries = async()=>{
    try {
      const r = await fetch(`${API}/manager/deliveries/`, { headers: auth });
      setDeliveries(await r.json());
    } catch (e) {
      notify("Failed to load deliveries", "error");
    }
  };

  const loadCommissionReport = async()=>{
    try {
      const r = await fetch(`${API}/manager/commission-report/`, { headers: auth });
      const data = await r.json();
      setCommissionReport(data);
      setPrintDialogOpen(true);
    } catch (e) {
      notify("Failed to load commission report", "error");
    }
  };

  const printCommission = () => {
    if (!commissionReport) return;
    
    const printWindow = window.open("", "_blank");
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Commission Report - ${commissionReport.month}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Commission Report</h1>
          <p><strong>Month:</strong> ${commissionReport.month}</p>
          <p><strong>Report Date:</strong> ${commissionReport.report_date}</p>
          
          <table>
            <thead>
              <tr>
                <th>Delivery Person</th>
                <th>Total Deliveries</th>
                <th>Total Value (₹)</th>
                <th>Commission %</th>
                <th>Commission Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${commissionReport.delivery_persons.map(dp => `
                <tr>
                  <td>${dp.delivery_person_name}</td>
                  <td>${dp.total_deliveries}</td>
                  <td>${dp.total_value.toFixed(2)}</td>
                  <td>${dp.commission_percentage}%</td>
                  <td>${dp.commission_amount.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <div class="total">
            <p><strong>Total Commission: ₹ ${commissionReport.total_commission.toFixed(2)}</strong></p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(()=>{ 
    load(); 
    loadCustomers();
    loadSubscriptions();
    loadDeliveries();
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

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, mb: 2 }}>
          <Tab label="Quick Actions" />
          <Tab label="All Customers" />
          <Tab label="All Subscriptions" />
          <Tab label="All Deliveries" />
          <Tab label="Commission Report" />
        </Tabs>

        {/* Quick Actions Tab */}
        {tab === 0 && (
          <Grid container spacing={3} sx={{ mt:1 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p:3, borderRadius:"16px" }}>
                <Typography variant="h6">Monthly Billing</Typography>
                <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Auto-generate bills for all customers.</Typography>
                <Button sx={{ mt:2 }} variant="contained"
                  onClick={async()=>{ 
                    const r=await fetch(`${API}/manager/generate-bills/`,{ method:"POST", headers:auth }); 
                    r.ok ? notify("Bills generated ✅") : notify("Failed to generate bills", "error");
                  }}>
                  Generate Bills
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p:3, borderRadius:"16px" }}>
                <Typography variant="h6">Outstanding Dues</Typography>
                <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Send polite reminders & auto discontinue after 2 months.</Typography>
                <Button sx={{ mt:2 }} variant="contained"
                  onClick={async()=>{ 
                    const r=await fetch(`${API}/manager/send-reminders/`,{ method:"POST", headers:auth }); 
                    r.ok ? notify("Reminders queued ✅") : notify("Failed to send reminders", "error");
                  }}>
                  Send Reminders
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p:3, borderRadius:"16px" }}>
                <Typography variant="h6">Delivery Commission</Typography>
                <Typography variant="body2" sx={{ color:"#666", mt:1 }}>Compute 2.5% commission per delivery person.</Typography>
                <Button sx={{ mt:2 }} variant="contained"
                  onClick={async()=>{ 
                    const r=await fetch(`${API}/manager/compute-commission/`,{ method:"POST", headers:auth }); 
                    if (r.ok) {
                      const data = await r.json();
                      notify(`Commission computed. Total: ₹${Object.values(data).reduce((a,b)=>a+b,0).toFixed(2)} ✅`);
                    } else {
                      notify("Failed to compute commission", "error");
                    }
                  }}>
                  Compute Commission
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* All Customers Tab */}
        {tab === 1 && (
          <Paper sx={{ p: 3, borderRadius: "16px", mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>All Customers</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Username</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
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
                      <TableCell>{c.phone || "N/A"}</TableCell>
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
        {tab === 2 && (
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
                  <TableCell><strong>End Date</strong></TableCell>
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
                      <TableCell>{s.end_date || "N/A"}</TableCell>
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

        {/* All Deliveries Tab */}
        {tab === 3 && (
          <Paper sx={{ p: 3, borderRadius: "16px", mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>All Deliveries</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Delivery Person</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Value (₹)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.length > 0 ? (
                  deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>{d.delivery_person_name}</TableCell>
                      <TableCell>{d.customer_name}</TableCell>
                      <TableCell>{d.address}</TableCell>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{d.status}</TableCell>
                      <TableCell>{d.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No deliveries found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Commission Report Tab */}
        {tab === 4 && (
          <Paper sx={{ p: 3, borderRadius: "16px", mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Commission Report</Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
              Generate and print commission report for all delivery persons (2.5% commission per delivery).
            </Typography>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={loadCommissionReport}
            >
              Generate & Print Commission Report
            </Button>
          </Paper>
        )}
      </Box>

      {/* Commission Print Dialog */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Commission Report - {commissionReport?.month}</DialogTitle>
        <DialogContent>
          {commissionReport && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                Report Date: {commissionReport.report_date}
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Delivery Person</strong></TableCell>
                    <TableCell><strong>Total Deliveries</strong></TableCell>
                    <TableCell><strong>Total Value (₹)</strong></TableCell>
                    <TableCell><strong>Commission %</strong></TableCell>
                    <TableCell><strong>Commission Amount (₹)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissionReport.delivery_persons.map((dp) => (
                    <TableRow key={dp.delivery_person_id}>
                      <TableCell>{dp.delivery_person_name}</TableCell>
                      <TableCell>{dp.total_deliveries}</TableCell>
                      <TableCell>{dp.total_value.toFixed(2)}</TableCell>
                      <TableCell>{dp.commission_percentage}%</TableCell>
                      <TableCell>{dp.commission_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="h6" sx={{ mt: 3, fontWeight: 800 }}>
                Total Commission: ₹ {commissionReport.total_commission.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={printCommission}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
