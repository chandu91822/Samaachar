import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, Tabs, Tab, Snackbar, Alert, IconButton, Menu, MenuItem
} from "@mui/material";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AccountCircle from "@mui/icons-material/AccountCircle";

const API = "http://127.0.0.1:8000/api";

export default function SubscriptionManagerDashboard() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/login";

  const auth = { Authorization: `Bearer ${token}` };

  // State
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [subscribeRequests, setSubscribeRequests] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [pauseRequests, setPauseRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Plan dialog state
  const [openPlan, setOpenPlan] = useState(false);
  const [editId, setEditId] = useState(null);
  const [planForm, setPlanForm] = useState({ title: "", price: "", description: "" });

  // Billing
  const [bills, setBills] = useState([]);
  const [billId, setBillId] = useState("");

  // Notifications
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
  const notify = (msg, severity = "success") => setSnack({ open: true, severity, msg });

  // Profile menu
  const [profileAnchor, setProfileAnchor] = useState(null);
  const openProfile = Boolean(profileAnchor);
  const handleProfileClick = (e) => setProfileAnchor(e.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/plans/`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      notify("Failed to load plans", "error");
    }
  };

  // Fetch All Requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [subRes, changeRes, pauseRes] = await Promise.all([
        fetch(`${API}/sm/requests/subscribe/`, { headers: auth }),
        fetch(`${API}/sm/requests/change/`, { headers: auth }),
        fetch(`${API}/sm/requests/pause/`, { headers: auth }),
      ]);

      setSubscribeRequests(subRes.ok ? await subRes.json() : []);
      setChangeRequests(changeRes.ok ? await changeRes.json() : []);
      setPauseRequests(pauseRes.ok ? await pauseRes.json() : []);
    } catch (err) {
      notify("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Bills
  const fetchBills = async () => {
    try {
      const r = await fetch(`${API}/manager/bills/`, { headers: auth });
      if (r.ok) setBills(await r.json());
    } catch (_) {}
  };

  // Initial load
  useEffect(() => {
    fetchPlans();
    fetchRequests();
    fetchBills();
  }, []);

  // Refresh requests when switching to requests tab
  useEffect(() => {
    if (tab === 1) fetchRequests();
  }, [tab]);

  // Refresh bills when switching to billing tab
  useEffect(() => {
    if (tab === 2) fetchBills();
  }, [tab]);

  // Save Plan
  const savePlan = async () => {
    try {
      const url = editId ? `${API}/plans/update/${editId}/` : `${API}/plans/add/`;
      const method = editId ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(planForm),
      });

      if (r.ok) {
        notify("Plan saved ✅");
        setOpenPlan(false);
        setEditId(null);
        setPlanForm({ title: "", price: "", description: "" });
        fetchPlans();
      } else notify("Failed to save plan", "error");
    } catch (_) {
      notify("Failed to save plan", "error");
    }
  };

  // Delete Plan
  const deletePlan = async (id) => {
    if (!window.confirm("Delete plan?")) return;

    const r = await fetch(`${API}/plans/delete/${id}/`, {
      method: "DELETE",
      headers: auth,
    });

    if (r.ok) {
      notify("Plan deleted");
      fetchPlans();
    } else notify("Failed", "error");
  };

  // Approve/Reject Request
  const handleRequestAction = async (type, id, approve = true) => {
    try {
      const r = await fetch(
        `${API}/sm/requests/${type}/${id}/${approve ? "approve" : "reject"}/`,
        { method: "POST", headers: auth }
      );

      if (r.ok) {
        notify("Updated");
        fetchRequests();
      } else notify("Failed", "error");
    } catch (_) {
      notify("Failed", "error");
    }
  };

  // Generate Bills
  const generateBills = async () => {
    const r = await fetch(`${API}/manager/generate-bills/`, {
      method: "POST",
      headers: auth,
    });

    if (r.ok) {
      notify("Bills generated");
      fetchBills();
    } else notify("Failed", "error");
  };

  // Mark Bill Paid
  const markBillPaid = async (billIdToMark) => {
    const id = billIdToMark || billId.trim();
    if (!id) return notify("Enter bill ID");

    const r = await fetch(`${API}/manager/bills/${id}/mark-paid/`, {
      method: "POST",
      headers: auth,
    });

    if (r.ok) {
      notify("Bill marked paid");
      setBillId("");
      fetchBills();
    } else notify("Failed", "error");
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#eef2ff,#dfe3ff)" }}>
      
      {/* TOP NAVBAR */}
      <AppBar position="sticky" sx={{ background: "#fff", color: "#222" }} elevation={1}>
        <Toolbar>
          <LibraryBooksIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
            Subscription Manager Dashboard
          </Typography>

          {/* Tabs in the AppBar */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ mr: 3 }}
          >
            <Tab label="Plans" />
            <Tab label="Requests" />
            <Tab label="Billing" />
          </Tabs>

          {/* Profile Menu */}
          <IconButton onClick={handleProfileClick}>
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={profileAnchor}
            open={openProfile}
            onClose={handleProfileClose}
          >
            <MenuItem
              onClick={() => {
                handleProfileClose();
                logout();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* MAIN BODY */}
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        
        {/* ---------------- PLANS ---------------- */}
        {tab === 0 && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setOpenPlan(true);
                  setEditId(null);
                  setPlanForm({ title: "", price: "", description: "" });
                }}
              >
                + Add Plan
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {plans.map((p) => (
                <Paper key={p.id} sx={{ p: 3, borderRadius: "16px" }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {p.title}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, mt: 1 }}>₹ {p.price}</Typography>
                  <Typography sx={{ color: "#555", mt: 1 }}>{p.description}</Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => {
                        setOpenPlan(true);
                        setEditId(p.id);
                        setPlanForm({
                          title: p.title,
                          price: p.price,
                          description: p.description,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="contained" color="error" onClick={() => deletePlan(p.id)}>
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* ---------------- REQUESTS ---------------- */}
        {tab === 1 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              Requests
            </Typography>

            {/* Subscription Requests */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Subscription Requests ({subscribeRequests.length})
            </Typography>
            <Paper sx={{ p: 2, borderRadius: "16px", mb: 3 }}>
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
                  {subscribeRequests.length ? (
                    subscribeRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>#{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.plan_title}</TableCell>
                        <TableCell align="right">
                          <Button
                            sx={{ mr: 1 }}
                            variant="contained"
                            color="success"
                            onClick={() => handleRequestAction("subscribe", r.id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRequestAction("subscribe", r.id, false)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* Change Requests */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Change Requests ({changeRequests.length})
            </Typography>
            <Paper sx={{ p: 2, borderRadius: "16px", mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Decision</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changeRequests.length ? (
                    changeRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.plan_title}</TableCell>
                        <TableCell>{r.action}</TableCell>
                        <TableCell align="right">
                          <Button
                            sx={{ mr: 1 }}
                            variant="contained"
                            onClick={() => handleRequestAction("change", r.id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRequestAction("change", r.id, false)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No change requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* Pause Requests */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Pause Requests ({pauseRequests.length})
            </Typography>
            <Paper sx={{ p: 2, borderRadius: "16px" }}>
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
                  {pauseRequests.length ? (
                    pauseRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.start_date}</TableCell>
                        <TableCell>{r.end_date}</TableCell>
                        <TableCell>{r.reason || "-"}</TableCell>
                        <TableCell align="right">
                          <Button
                            sx={{ mr: 1 }}
                            variant="contained"
                            onClick={() => handleRequestAction("pause", r.id, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRequestAction("pause", r.id, false)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No pause requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* ---------------- BILLING ---------------- */}
        {tab === 2 && (
          <Box>
            {/* Generate Bills */}
            <Paper sx={{ p: 3, borderRadius: "16px", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Generate This Month's Bills
              </Typography>
              <Typography sx={{ color: "#666", mb: 2 }}>
                Calculates monthly payment for all active subscriptions
              </Typography>
              <Button variant="contained" onClick={generateBills}>
                Generate Bills
              </Button>
            </Paper>

            {/* Bills Table */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              All Bills ({bills.length})
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "16px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.length ? (
                    bills.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>#{b.id}</TableCell>
                        <TableCell>{b.customer_name}</TableCell>
                        <TableCell>{b.month}</TableCell>
                        <TableCell>₹ {b.total_amount}</TableCell>
                        <TableCell>
                          {b.is_paid ? "Paid ✅" : "Unpaid ❌"}
                        </TableCell>
                        <TableCell align="right">
                          {!b.is_paid && (
                            <Button variant="contained" color="success" size="small" onClick={() => markBillPaid(b.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No bills found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

           
          </Box>
        )}
      </Box>

      {/* Plan Dialog */}
      <Dialog open={openPlan} onClose={() => setOpenPlan(false)}>
        <DialogTitle>{editId ? "Edit Plan" : "Add Plan"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            sx={{ mt: 1 }}
            value={planForm.title}
            onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
          />
          <TextField
            label="Price"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={planForm.price}
            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlan(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePlan}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
