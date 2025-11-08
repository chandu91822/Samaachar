import React, { useEffect, useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Menu, MenuItem,
  Box, Paper, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, InputLabel,
  FormControl, Snackbar, Alert
} from "@mui/material";
import NewspaperIcon from "@mui/icons-material/Newspaper";

const API = "http://127.0.0.1:8000/api";

export default function CustomerDashboard() {
  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/login";

  const auth = { Authorization: `Bearer ${token}` };

  const [anchorEl, setAnchorEl] = useState(null);
  const [plans, setPlans] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  // dialogs
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

  // snackbars
  const [snack, setSnack] = useState({ open:false, severity:"success", msg:"" });
  const openMenu = Boolean(anchorEl);

  const notify = (msg, severity="success") => setSnack({ open:true, severity, msg });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [p, s, b] = await Promise.all([
        fetch(`${API}/plans/`).then(r=>r.json()),
        fetch(`${API}/customer/subscriptions/`, { headers: auth }).then(r=>r.json()),
        fetch(`${API}/customer/bills/current-month/`, { headers: auth }).then(r=>r.json()),
      ]);
      setPlans(Array.isArray(p) ? p : []);
      setMySubs(Array.isArray(s) ? s : []);
      setBill(Object.keys(b || {}).length ? b : null);
    } catch (e) {
      console.error(e);
      notify("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ loadAll(); /* eslint-disable-next-line */ },[]);

  const subscribe = async (planId) => {
    try {
      const r = await fetch(`${API}/customer/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ plan_id: planId })
      });
      if (r.status === 201) {
        notify("Request sent to Subscription Manager ✅");
      } else {
        const data = await r.json().catch(()=> ({}));
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
        setChangeForm({ plan_id:"", action:"add" });
        loadAll();
      } else {
        const d = await r.json().catch(()=> ({}));
        notify(d?.error || "Failed to send change request", "error");
      }
    } catch {
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
        const d = await r.json().catch(()=> ({}));
        notify(d?.error || "Failed to send pause request", "error");
      }
    } catch {
      notify("Failed to send pause request", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #eef2ff, #dfe3ff)" }}>
      <AppBar position="sticky" elevation={1} sx={{ background: "#fff", color: "#222" }}>
        <Toolbar>
          <NewspaperIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 800 }}>
            Customer Dashboard
          </Typography>
          <Button onClick={(e)=>setAnchorEl(e.currentTarget)} sx={{ textTransform:"none" }}>Menu ▾</Button>
          <Menu anchorEl={anchorEl} open={openMenu} onClose={()=>setAnchorEl(null)}>
            <MenuItem onClick={()=>{ setAnchorEl(null); setChangeOpen(true); }}>Change Subscription</MenuItem>
            <MenuItem onClick={()=>{ setAnchorEl(null); setComplaintOpen(true); }}>Raise Complaint</MenuItem>
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        {loading ? (
          <Box sx={{ display:"flex", justifyContent:"center", mt:8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Available Plans */}
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 900 }}>
              Available Plans
            </Typography>

            <Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "1fr 1fr",
      md: "repeat(3, 1fr)"
    },
    gap: 3,
    alignItems: "stretch",
  }}
>

              {plans.map((plan)=>(
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
                  <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 1 }}>
                    ₹ {plan.price}
                  </Typography>
                  <Typography sx={{ color:"#555", mt: 1, minHeight: 48 }}>
                    {plan.description}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={()=>subscribe(plan.id)}
                  >
                    Subscribe (send request)
                  </Button>
                </Paper>
              ))}
            </Box>

            {/* My Subscriptions */}
            <Typography variant="h5" sx={{ mt: 5, mb: 2, fontWeight: 900 }}>
              My Subscriptions
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              {mySubs.map((s)=>(
                <Paper key={s.id} sx={{ p:2, borderRadius:"16px", background:"#fff" }}>
                  <Typography sx={{ fontWeight: 700 }}>{s.plan_title}</Typography>
                  <Typography variant="body2" sx={{ color:"#666" }}>
                    Status: {s.status}
                  </Typography>

                  {s.status === "paused" && s.resume_date && (
                    <Typography variant="body2" sx={{ color:"#666" }}>
                      Resumes on: {s.resume_date}
                    </Typography>
                  )}

                  {/* ✅ Pause button for active subscriptions */}
                  {s.status === "active" && (
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={()=>{
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
                <Paper sx={{ p:2, borderRadius:"16px" }}>
                  <Typography color="text.secondary">No subscriptions yet.</Typography>
                </Paper>
              )}
            </Box>

            {/* Bill */}
            <Typography variant="h5" sx={{ mt: 5, mb: 2, fontWeight: 900 }}>
              This Month Bill
            </Typography>

            {bill ? (
              <Paper sx={{ p:3, borderRadius:"16px", background:"#fff" }}>
                <Typography>Bill #{bill.id} • Month: {bill.month}</Typography>
                <Typography>Total: ₹ {bill.total_amount}</Typography>
                <Typography>
                  Paid: {bill.is_paid ? "Yes ✅" : "No ❌"}
                </Typography>
              </Paper>
            ) : (
              <Typography>No bill generated yet.</Typography>
            )}
          </>
        )}
      </Box>

      {/* Pause Dialog */}
      <Dialog open={pauseOpen} onClose={()=>setPauseOpen(false)}>
        <DialogTitle>Pause Delivery (requires approval)</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, mb: 1, color:"#666" }}>
            Subscription ID: {pauseForm.subscription_id}
          </Typography>

          <TextField
            type="date"
            label="Start"
            fullWidth
            sx={{ mt:2 }}
            InputLabelProps={{shrink:true}}
            value={pauseForm.start_date}
            onChange={e=>setPauseForm({...pauseForm,start_date:e.target.value})}
          />
          <TextField
            type="date"
            label="End"
            fullWidth
            sx={{ mt:2 }}
            InputLabelProps={{shrink:true}}
            value={pauseForm.end_date}
            onChange={e=>setPauseForm({...pauseForm,end_date:e.target.value})}
          />
          <TextField
            label="Reason"
            fullWidth
            sx={{ mt:2 }}
            multiline
            rows={3}
            value={pauseForm.reason}
            onChange={e=>setPauseForm({...pauseForm,reason:e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setPauseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={requestPause}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Change Subscription */}
      <Dialog open={changeOpen} onClose={()=>setChangeOpen(false)}>
        <DialogTitle>Change Subscription (applies after 7 days)</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt:2 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              native
              label="Plan"
              value={changeForm.plan_id}
              onChange={(e)=>setChangeForm({...changeForm, plan_id:e.target.value})}
            >
              <option value=""/>
              {plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt:2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              native
              label="Action"
              value={changeForm.action}
              onChange={(e)=>setChangeForm({...changeForm, action:e.target.value})}
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setChangeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={requestChange}>Request</Button>
        </DialogActions>
      </Dialog>

      {/* Complaint */}
      <Dialog open={complaintOpen} onClose={()=>setComplaintOpen(false)}>
        <DialogTitle>Raise Complaint</DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={4}
            sx={{ mt:1 }}
            value={complaintText}
            onChange={e=>setComplaintText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setComplaintOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async ()=>{
              try{
                const r = await fetch(`${API}/cse/complaints/`, {
                  method:"POST",
                  headers:{ "Content-Type":"application/json", ...auth },
                  body: JSON.stringify({ message: complaintText }),
                });
                if(r.ok){ setComplaintOpen(false); setComplaintText(""); notify("Complaint submitted ✅"); }
                else notify("Failed to submit complaint","error");
              }catch{
                notify("Failed to submit complaint","error");
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack({...snack, open:false})}>
        <Alert severity={snack.severity} onClose={()=>setSnack({...snack, open:false})}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
