import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, Tabs, Tab, Snackbar, Alert
} from "@mui/material";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

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

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/plans/`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching plans:", err);
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

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscribeRequests(Array.isArray(data) ? data : []);
      } else {
        setSubscribeRequests([]);
      }

      if (changeRes.ok) {
        const data = await changeRes.json();
        setChangeRequests(Array.isArray(data) ? data : []);
      } else {
        setChangeRequests([]);
      }

      if (pauseRes.ok) {
        const data = await pauseRes.json();
        setPauseRequests(Array.isArray(data) ? data : []);
      } else {
        setPauseRequests([]);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      notify("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPlans();
    fetchRequests();
    fetchBills();
  }, []);

  // Refresh requests when switching to requests tab
  useEffect(() => {
    if (tab === 1) {
      fetchRequests();
    }
  }, [tab]);

  // Refresh bills when switching to billing tab
  useEffect(() => {
    if (tab === 2) {
      fetchBills();
    }
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
        setOpenPlan(false);
        setEditId(null);
        setPlanForm({ title: "", price: "", description: "" });
        fetchPlans();
        notify("Plan saved ✅");
      } else {
        notify("Failed to save plan", "error");
      }
    } catch (err) {
      notify("Failed to save plan", "error");
    }
  };

  // Delete Plan
  const deletePlan = async (id) => {
    if (!window.confirm("Delete plan?")) return;

    try {
      const r = await fetch(`${API}/plans/delete/${id}/`, {
        method: "DELETE",
        headers: auth
      });

      if (r.ok) {
        notify("Plan deleted ✅");
        fetchPlans();
      } else {
        notify("Failed to delete plan", "error");
      }
    } catch (err) {
      notify("Failed to delete plan", "error");
    }
  };

  // Approve/Reject Request
  const handleRequestAction = async (type, id, approve = true) => {
    try {
      const r = await fetch(
        `${API}/sm/requests/${type}/${id}/${approve ? "approve" : "reject"}/`,
        { method: "POST", headers: auth }
      );

      if (r.ok) {
        notify(`${type} request ${approve ? "approved" : "rejected"} ✅`);
        fetchRequests();
      } else {
        notify("Action failed", "error");
      }
    } catch (err) {
      notify("Action failed", "error");
    }
  };

  // Fetch Bills
  const fetchBills = async () => {
    try {
      const r = await fetch(`${API}/manager/bills/`, { headers: auth });
      if (r.ok) {
        const data = await r.json();
        setBills(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  // Generate Bills
  const generateBills = async () => {
    try {
      const r = await fetch(`${API}/manager/generate-bills/`, {
        method: "POST",
        headers: auth,
      });

      if (r.ok) {
        notify("Bills generated for this month ✅");
        fetchBills(); // Refresh bills list
      } else {
        notify("Failed to generate bills", "error");
      }
    } catch (err) {
      notify("Failed to generate bills", "error");
    }
  };

  // Mark Bill Paid
  const markBillPaid = async (billIdToMark) => {
    const id = billIdToMark || billId.trim();
    if (!id) {
      notify("Enter a bill ID", "warning");
      return;
    }

    try {
      const r = await fetch(`${API}/manager/bills/${id}/mark-paid/`, {
        method: "POST",
        headers: auth,
      });

      if (r.ok) {
        notify(`Bill #${id} marked paid ✅`);
        setBillId("");
        fetchBills(); // Refresh bills list
      } else {
        const error = await r.json().catch(() => ({}));
        notify(error?.error || "Failed to mark paid", "error");
      }
    } catch (err) {
      notify("Failed to mark paid", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef2ff" }}>
      {/* Header */}
      

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Plans" />
          <Tab 
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Requests
                {subscribeRequests.length > 0 && (
                  <Box
                    sx={{
                      bgcolor: "error.main",
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "bold"
                    }}
                  >
                    {subscribeRequests.length}
                  </Box>
                )}
              </Box>
            } 
          />
          <Tab label="Billing" />
        </Tabs>

        {/* PLANS TAB */}
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
                        setPlanForm({
                          title: p.title,
                          price: p.price,
                          description: p.description
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      onClick={() => deletePlan(p.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* REQUESTS TAB */}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Requests
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                  Pending: {subscribeRequests.length} subscription requests
                </Typography>
              </Box>
              <Button variant="outlined" onClick={fetchRequests} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </Box>

            {/* Subscribe Requests */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Subscribe Requests ({subscribeRequests.length})
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "14px", mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Plan</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscribeRequests.length > 0 ? (
                    subscribeRequests.map((r) => (
                      <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                        <TableCell><strong>#{r.id}</strong></TableCell>
                        <TableCell>{r.customer_name || "Unknown"}</TableCell>
                        <TableCell>{r.plan_title || "Unknown Plan"}</TableCell>
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
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" sx={{ color: "#666" }}>
                          No pending subscription requests.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#999", mt: 1 }}>
                          When customers subscribe to a plan, their requests will appear here.
                        </Typography>
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

            <Paper sx={{ p: 2, borderRadius: "14px", mb: 3 }}>
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
                  {changeRequests.length > 0 ? (
                    changeRequests.map(r => (
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
                      <TableCell colSpan={5} align="center">No pending change requests.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* Pause Requests */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Pause Requests ({pauseRequests.length})
            </Typography>

            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pauseRequests.length > 0 ? (
                    pauseRequests.map(r => (
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
                      <TableCell colSpan={6} align="center">No pending pause requests.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* BILLING TAB */}
        {tab === 2 && (
          <Box>
            <Paper sx={{ p: 2, borderRadius: "14px", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Generate This Month's Bills
              </Typography>
              <Typography variant="body2" sx={{ color: "#555", mb: 2 }}>
                Calculates monthly amount for all active subscriptions.
              </Typography>
              <Button variant="contained" onClick={generateBills}>
                Generate Bills
              </Button>
            </Paper>

            {/* All Bills List */}
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              All Bills ({bills.length})
            </Typography>
            <Paper sx={{ p: 2, borderRadius: "14px", mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Bill ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Month</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.length > 0 ? (
                    bills.map(bill => (
                      <TableRow key={bill.id} sx={{ "&:hover": { bgcolor: "#f5f5f5" } }}>
                        <TableCell><strong>#{bill.id}</strong></TableCell>
                        <TableCell>{bill.customer_name || "Unknown"}</TableCell>
                        <TableCell>{bill.month}</TableCell>
                        <TableCell>₹ {bill.total_amount}</TableCell>
                        <TableCell>
                          {bill.is_paid ? (
                            <Typography sx={{ color: "success.main", fontWeight: 600 }}>
                              Paid ✅
                            </Typography>
                          ) : (
                            <Typography sx={{ color: "error.main", fontWeight: 600 }}>
                              Unpaid ❌
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {!bill.is_paid && (
                            <Button 
                              variant="contained" 
                              color="success"
                              size="small"
                              onClick={() => markBillPaid(bill.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" sx={{ color: "#666" }}>
                          No bills found. Generate bills to see them here.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            {/* Manual Mark Paid (by ID) */}
            <Paper sx={{ p: 2, borderRadius: "14px" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Mark Bill as Paid (by ID)
              </Typography>
              <Typography variant="body2" sx={{ color: "#555", mb: 2 }}>
                Enter a bill ID from the list above to mark it as paid.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  label="Bill ID"
                  type="number"
                  sx={{ width: 200 }}
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                  placeholder="Enter bill ID"
                />
                <Button variant="contained" onClick={() => markBillPaid()}>
                  Mark Paid
                </Button>
              </Box>
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
            fullWidth
            type="number"
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
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
