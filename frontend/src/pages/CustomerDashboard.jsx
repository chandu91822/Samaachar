import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import NewspaperIcon from "@mui/icons-material/Newspaper";

const API = "http://127.0.0.1:8000/api";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ mt: 2 }}>{children}</Box> : null;
}

export default function CustomerDashboard() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/login";
  const auth = { Authorization: `Bearer ${token}` };

  // app state
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [bill, setBill] = useState(null);
  const [subscribeRequests, setSubscribeRequests] = useState([]);
  const [pauseRequests, setPauseRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // dialogs/forms
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseForm, setPauseForm] = useState({
    subscription_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [changeOpen, setChangeOpen] = useState(false);
  const [changeForm, setChangeForm] = useState({ plan_id: "", action: "add" });

  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");

  // notif/snackbar
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });

  const notify = (msg, severity = "success") => setSnack({ open: true, severity, msg });

  // profile dropdown
  const [anchorProfile, setAnchorProfile] = useState(null);
  const openProfile = Boolean(anchorProfile);

  const handleProfileClick = (e) => setAnchorProfile(e.currentTarget);
  const handleProfileClose = () => setAnchorProfile(null);

  // load data
  const loadAll = async () => {
    try {
      setLoading(true);
      const [
        p,
        s,
        b,
        subReqs,
        pauseReqs,
        comps,
      ] = await Promise.all([
        fetch(`${API}/plans/`).then((r) => r.json()),
        fetch(`${API}/customer/subscriptions/`, { headers: auth }).then((r) => r.json()),
        fetch(`${API}/customer/bills/current-month/`, { headers: auth }).then((r) => r.json()),
        fetch(`${API}/customer/subscribe-requests/`, { headers: auth }).then((r) => r.json()),
        fetch(`${API}/customer/pause-requests/`, { headers: auth }).then((r) => r.json()),
        fetch(`${API}/customer/my-complaints/`, { headers: auth }).then((r) => r.json()),
      ]);

      setPlans(Array.isArray(p) ? p : []);
      setMySubs(Array.isArray(s) ? s : []);
      setBill(Object.keys(b || {}).length ? b : null);
      setSubscribeRequests(Array.isArray(subReqs) ? subReqs : []);
      setPauseRequests(Array.isArray(pauseReqs) ? pauseReqs : []);
      setComplaints(Array.isArray(comps) ? comps : []);
    } catch (e) {
      console.error(e);
      notify("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  // actions
  const subscribe = async (planId) => {
    try {
      const r = await fetch(`${API}/customer/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (r.status === 201) {
        notify("Request sent to Subscription Manager ✅");
      } else {
        const data = await r.json().catch(() => ({}));
        if (r.ok) notify("Already subscribed or request exists", "info");
        else notify(data?.error || "Failed to send request", "error");
      }
    } catch (e) {
      console.error(e);
      notify("Failed to send request", "error");
    } finally {
      loadAll();
    }
  };

  const requestChange = async () => {
    try {
      const r = await fetch(`${API}/customer/change-request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(changeForm),
      });
      if (r.ok) {
        notify("Change request sent ✅");
        setChangeOpen(false);
        setChangeForm({ plan_id: "", action: "add" });
        loadAll();
      } else {
        const d = await r.json().catch(() => ({}));
        notify(d?.error || "Failed to send change request", "error");
      }
    } catch (e) {
      console.error(e);
      notify("Failed to send change request", "error");
    }
  };

  const requestPause = async () => {
    try {
      const r = await fetch(`${API}/customer/pause-request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(pauseForm),
      });

      if (r.ok) {
        notify("Pause request sent ✅");
        setPauseOpen(false);
        setPauseForm({
          subscription_id: "",
          start_date: "",
          end_date: "",
          reason: "",
        });
        loadAll();
      } else {
        const d = await r.json().catch(() => ({}));
        notify(d?.error || "Failed to send pause request", "error");
      }
    } catch (e) {
      console.error(e);
      notify("Failed to send pause request", "error");
    }
  };

  // complaint handler inside dialog submit
  const submitComplaint = async () => {
    try {
      const r = await fetch(`${API}/customer/complaints/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ message: complaintText }),
      });
      if (r.ok) {
        setComplaintOpen(false);
        setComplaintText("");
        notify("Complaint submitted ✅");
        loadAll();
      } else {
        notify("Failed to submit complaint", "error");
      }
    } catch (e) {
      console.error(e);
      notify("Failed to submit complaint", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // UI helpers
  const handleTabChange = (_, newVal) => setTab(newVal);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #eef2ff, #dfe3ff)" }}>
      <AppBar position="sticky" elevation={1} sx={{ background: "#fff", color: "#222" }}>
        <Toolbar sx={{ gap: 2 }}>
          <NewspaperIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800 }}>
            Customer Dashboard
          </Typography>

          {/* Tabs in AppBar */}
          <Tabs
            value={tab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTabs-indicator": { height: 3, borderRadius: 3 },
              mr: 2,
            }}
          >
            <Tab label="PLANS" />
            <Tab label="SUBSCRIPTIONS" />
            <Tab label="REQUESTS" />
            <Tab label="BILLING" />
          </Tabs>

          {/* Profile dropdown (replaces old Menu ▾) */}
          <IconButton onClick={handleProfileClick} size="large" color="inherit">
            <AccountCircle />
          </IconButton>
          <Menu anchorEl={anchorProfile} open={openProfile} onClose={handleProfileClose}>
            <MenuItem
              onClick={() => {
                handleProfileClose();
                setChangeOpen(true);
              }}
            >
              Change Subscription
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleProfileClose();
                setComplaintOpen(true);
              }}
            >
              Raise Complaint
            </MenuItem>
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

      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* TAB PANELS */}
            <TabPanel value={tab} index={0}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
                Available Plans
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                  gap: 3,
                  alignItems: "stretch",
                }}
              >
                {plans.map((plan) => (
                  <Paper
                    key={plan.id}
                    sx={{
                      p: 3,
                      borderRadius: "18px",
                      background: "#fff",
                      border: "1px solid #eceefe",
                      transition: "transform .2s, box-shadow .2s",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {plan.title}
                    </Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 1 }}>₹ {plan.price}</Typography>
                    <Typography sx={{ color: "#555", mt: 1, minHeight: 48 }}>{plan.description}</Typography>

                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button variant="contained" onClick={() => subscribe(plan.id)}>
                        Subscribe (send request)
                      </Button>
                    </Box>
                  </Paper>
                ))}
                {plans.length === 0 && (
                  <Paper sx={{ p: 2, borderRadius: "16px" }}>
                    <Typography color="text.secondary">No plans available.</Typography>
                  </Paper>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tab} index={1}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
                My Subscriptions
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                  gap: 2,
                }}
              >
                {mySubs.map((s) => (
                  <Paper key={s.id} sx={{ p: 2, borderRadius: "16px", background: "#fff" }}>
                    <Typography sx={{ fontWeight: 700 }}>{s.plan_title}</Typography>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Status: {s.status}
                    </Typography>

                    {s.status === "paused" && s.resume_date && (
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Resumes on: {s.resume_date}
                      </Typography>
                    )}

                    {s.status === "active" && (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          setPauseForm({
                            subscription_id: s.id,
                            start_date: "",
                            end_date: "",
                            reason: "",
                          });
                          setPauseOpen(true);
                        }}
                      >
                        Pause Delivery
                      </Button>
                    )}
                  </Paper>
                ))}
                {mySubs.length === 0 && (
                  <Paper sx={{ p: 2, borderRadius: "16px" }}>
                    <Typography color="text.secondary">No subscriptions yet.</Typography>
                  </Paper>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tab} index={2}>
              {/* Requests: subscription requests + pause requests + complaints */}
              <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 900 }}>
                Subscription Requests
              </Typography>

              {subscribeRequests.length > 0 ? (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  {subscribeRequests.map((req) => (
                    <Paper key={req.id} sx={{ p: 2, borderRadius: "16px", background: "#fff" }}>
                      <Typography sx={{ fontWeight: 700 }}>Plan: {req.plan_title}</Typography>
                      <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
                        Status: {req.approved === null ? "⏳ Pending" : req.approved === true ? "✅ Approved" : "❌ Declined"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666", fontSize: "0.85rem" }}>
                        Requested: {new Date(req.created_at).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No subscription requests.</Typography>
              )}

              <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 900 }}>
                Pause Requests
              </Typography>
              {pauseRequests.length > 0 ? (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  {pauseRequests.map((req) => (
                    <Paper key={req.id} sx={{ p: 2, borderRadius: "16px", background: "#fff" }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {req.start_date} to {req.end_date}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
                        Status: {req.approved === null ? "⏳ Pending" : req.approved === true ? "✅ Approved" : "❌ Declined"}
                      </Typography>
                      {req.reason && <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>Reason: {req.reason}</Typography>}
                      <Typography variant="body2" sx={{ color: "#666", fontSize: "0.85rem", mt: 1 }}>
                        Requested: {new Date(req.created_at).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No pause requests.</Typography>
              )}

              <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 900 }}>
                Complaints & Responses
              </Typography>
              {complaints.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {complaints.map((c) => (
                    <Paper key={c.id} sx={{ p: 3, borderRadius: "16px", background: "#fff" }}>
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>Complaint #{c.id}</Typography>
                      <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>{c.message}</Typography>
                      <Typography variant="body2" sx={{ color: "#888", fontSize: "0.85rem", mb: 2 }}>
                        Status: {c.status} • Created: {new Date(c.created_at).toLocaleDateString()}
                      </Typography>
                      {c.last_reply && (
                        <Box sx={{ mt: 2, p: 2, background: "#f5f5f5", borderRadius: "8px" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Response from Customer Service:</Typography>
                          <Typography variant="body2" sx={{ color: "#333" }}>{c.last_reply}</Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No complaints.</Typography>
              )}
            </TabPanel>

            <TabPanel value={tab} index={3}>
              <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 900 }}>
                This Month Bill
              </Typography>

              {bill ? (
                <Paper sx={{ p: 3, borderRadius: "16px", background: "#fff" }}>
                  <Typography>Bill #{bill.id} • Month: {bill.month}</Typography>
                  <Typography>Total: ₹ {bill.total_amount}</Typography>
                  <Typography>Paid: {bill.is_paid ? "Yes ✅" : "No ❌"}</Typography>
                </Paper>
              ) : (
                <Typography>No bill generated yet.</Typography>
              )}
            </TabPanel>
          </>
        )}
      </Box>

      {/* Pause Dialog */}
      <Dialog open={pauseOpen} onClose={() => setPauseOpen(false)}>
        <DialogTitle>Pause Delivery (requires approval)</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, mb: 1, color: "#666" }}>
            Subscription ID: {pauseForm.subscription_id}
          </Typography>

          <TextField
            type="date"
            label="Start"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={pauseForm.start_date}
            onChange={(e) => setPauseForm({ ...pauseForm, start_date: e.target.value })}
          />
          <TextField
            type="date"
            label="End"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={pauseForm.end_date}
            onChange={(e) => setPauseForm({ ...pauseForm, end_date: e.target.value })}
          />
          <TextField
            label="Reason"
            fullWidth
            sx={{ mt: 2 }}
            multiline
            rows={3}
            value={pauseForm.reason}
            onChange={(e) => setPauseForm({ ...pauseForm, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPauseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={requestPause}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Change Subscription Dialog */}
      <Dialog open={changeOpen} onClose={() => setChangeOpen(false)}>
        <DialogTitle>Change Subscription (applies after 7 days)</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              native
              label="Plan"
              value={changeForm.plan_id}
              onChange={(e) => setChangeForm({ ...changeForm, plan_id: e.target.value })}
            >
              <option value="" />
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              native
              label="Action"
              value={changeForm.action}
              onChange={(e) => setChangeForm({ ...changeForm, action: e.target.value })}
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={requestChange}>Request</Button>
        </DialogActions>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={complaintOpen} onClose={() => setComplaintOpen(false)}>
        <DialogTitle>Raise Complaint</DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 1 }}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComplaintOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitComplaint}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
