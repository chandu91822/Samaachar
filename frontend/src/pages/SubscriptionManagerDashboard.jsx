import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, Tabs, Tab, Snackbar, Alert
} from "@mui/material";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

export default function SubscriptionManagerDashboard() {
  const API = "http://127.0.0.1:8000/api";
  const token = localStorage.getItem("token");

  if (!token) window.location.href = "/login";
  const auth = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState(0);

  // ---------- PLANS ----------
  const [plans, setPlans] = useState([]);
  const [openPlan, setOpenPlan] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", price: "", description: "" });

  // ---------- REQUESTS ----------
  const [requests, setRequests] = useState({
    subscribe: [],
    change: [],
    pause: []
  });

  // ---------- BILLING ----------
  const [billId, setBillId] = useState("");

  // ---------- SNACKBAR ----------
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
  const notify = (msg, severity = "success") => setSnack({ open: true, severity, msg });

  // ===========================
  // FETCH PLANS
  // ===========================
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/plans/`);
      setPlans(await res.json());
    } catch {
      notify("Failed to load plans", "error");
    }
  };

  // ===========================
  // FETCH ALL REQUESTS
  // ===========================
  const fetchRequests = async () => {
    try {
      const [subReq, changeReq, pauseReq] = await Promise.all([
        fetch(`${API}/sm/requests/subscribe/`, { headers: auth }).then(r => r.json()),
        fetch(`${API}/sm/requests/change/`, { headers: auth }).then(r => r.json()),
        fetch(`${API}/sm/requests/pause/`, { headers: auth }).then(r => r.json()),
      ]);

      setRequests({
        subscribe: subReq,
        change: changeReq,
        pause: pauseReq
      });

    } catch {
      notify("Failed to load requests", "error");
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchRequests();
  }, []);

  // ===========================
  // SAVE PLAN
  // ===========================
  const savePlan = async () => {
    try {
      const url = editId ? `${API}/plans/update/${editId}/` : `${API}/plans/add/`;
      const method = editId ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(form),
      });

      if (r.ok) {
        setOpenPlan(false);
        setEditId(null);
        setForm({ title: "", price: "", description: "" });
        fetchPlans();
        notify("Plan saved ✅");
      } else notify("Failed to save plan", "error");
    } catch {
      notify("Failed to save plan", "error");
    }
  };

  const delPlan = async (id) => {
    if (!window.confirm("Delete plan?")) return;

    try {
      const r = await fetch(`${API}/plans/delete/${id}/`, {
        method: "DELETE",
        headers: auth
      });

      if (r.ok) {
        notify("Plan deleted ✅");
        fetchPlans();
      } else notify("Failed to delete plan", "error");
    } catch {
      notify("Failed to delete plan", "error");
    }
  };

  // ===========================
  // APPROVE / REJECT REQUESTS
  // ===========================
  const act = async (type, id, approve = true) => {
    try {
      const r = await fetch(
        `${API}/sm/requests/${type}/${id}/${approve ? "approve" : "reject"}/`,
        { method: "POST", headers: auth }
      );

      if (r.ok) {
        notify(`${type} ${approve ? "approved" : "rejected"} ✅`);
        fetchRequests();
      } else notify("Action failed", "error");

    } catch {
      notify("Action failed", "error");
    }
  };

  // ===========================
  // GENERATE MONTHLY BILLS
  // ===========================
  const generateBills = async () => {
    try {
      const r = await fetch(`${API}/manager/generate-bills/`, {
        method: "POST",
        headers: auth,
      });

      if (r.ok) notify("Bills generated for this month ✅");
      else notify("Failed to generate bills", "error");

    } catch {
      notify("Failed to generate bills", "error");
    }
  };

  // ===========================
  // MARK BILL PAID
  // ===========================
  const markPaid = async () => {
    if (!billId.trim()) return notify("Enter a bill ID", "warning");

    try {
      const r = await fetch(`${API}/subscription-manager/bill/${billId}/pay/`, {
        method: "POST",
        headers: auth,
      });

      if (r.ok) {
        notify(`Bill #${billId} marked paid ✅`);
        setBillId("");
      } else notify("Failed to mark paid", "error");

    } catch {
      notify("Failed to mark paid", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef2ff" }}>

      {/* HEADER */}
      <AppBar sx={{ bgcolor: "#fff", color: "#222" }} elevation={1}>
        <Toolbar>
          <LibraryBooksIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800 }}>
            Subscription Manager
          </Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        
        {/* TABS */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Plans" />
          <Tab label="Requests" />
          <Tab label="Billing" />
        </Tabs>

        {/* ===================== PLANS TAB ===================== */}
        {tab === 0 && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => { setOpenPlan(true); setEditId(null); }}
              >
                + Add Plan
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 2
              }}
            >
              {plans.map(p => (
                <Paper key={p.id} sx={{ p: 2, borderRadius: "14px" }}>
                  <Typography variant="h6">{p.title}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>₹ {p.price}</Typography>
                  <Typography variant="body2" sx={{ color: "#555", mt: 1 }}>
                    {p.description}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => {
                        setOpenPlan(true);
                        setEditId(p.id);
                        setForm({
                          title: p.title,
                          price: p.price,
                          description: p.description
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="contained" color="error" onClick={() => delPlan(p.id)}>
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* ===================== REQUESTS TAB ===================== */}
        {tab === 1 && (
          <Box>

            {/* SUBSCRIBE REQUESTS */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Subscribe Requests
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {requests.subscribe.length ? (
                    requests.subscribe.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.plan_title}</TableCell>
                        <TableCell align="right">
                          <Button sx={{ mr: 1 }} variant="contained" onClick={() => act("subscribe", r.id, true)}>Approve</Button>
                          <Button variant="outlined" color="error" onClick={() => act("subscribe", r.id, false)}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4}>No pending requests.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* CHANGE REQUESTS */}
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
              Change Requests
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {requests.change.length ? (
                    requests.change.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.plan_title}</TableCell>
                        <TableCell>{r.action}</TableCell>
                        <TableCell align="right">
                          <Button sx={{ mr: 1 }} variant="contained" onClick={() => act("change", r.id, true)}>Approve</Button>
                          <Button variant="outlined" color="error" onClick={() => act("change", r.id, false)}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5}>No pending requests.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* PAUSE REQUESTS */}
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
              Pause Requests
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {requests.pause.length ? (
                    requests.pause.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.start_date}</TableCell>
                        <TableCell>{r.end_date}</TableCell>
                        <TableCell>{r.reason}</TableCell>
                        <TableCell align="right">
                          <Button sx={{ mr: 1 }} variant="contained" onClick={() => act("pause", r.id, true)}>Approve</Button>
                          <Button variant="outlined" color="error" onClick={() => act("pause", r.id, false)}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6}>No pending requests.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* ===================== BILLING TAB ===================== */}
        {tab === 2 && (
          <Box>

            <Paper sx={{ p: 2, borderRadius: "14px", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Generate This Month's Bills</Typography>
              <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
                Calculates monthly amount for all customers.
              </Typography>
              <Button variant="contained" onClick={generateBills}>Generate Bills</Button>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Mark Bill as Paid</Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
                <TextField
                  label="Bill ID"
                  sx={{ width: 200 }}
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                />
                <Button variant="contained" onClick={markPaid}>Mark Paid</Button>
              </Box>
            </Paper>

          </Box>
        )}
      </Box>

      {/* ===================== PLAN DIALOG ===================== */}
      <Dialog open={openPlan} onClose={() => setOpenPlan(false)}>
        <DialogTitle>{editId ? "Edit Plan" : "Add Plan"}</DialogTitle>

        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            sx={{ mt: 1 }}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Price"
            fullWidth
            sx={{ mt: 2 }}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPlan(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePlan}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ===================== SNACKBAR ===================== */}
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
