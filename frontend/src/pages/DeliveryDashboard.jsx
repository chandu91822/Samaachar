import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent, Button } from "@mui/material";

export default function DeliveryDashboard() {
  const [summary, setSummary] = useState(null);
  const [stops, setStops] = useState([]);

  const token = localStorage.getItem("token");

  // ✅ Redirect if not logged in
  if (!token) {
    window.location.href = "/login";
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,   // ✅ FIXED
  };

  const loadData = async () => {
    try {
      // ✅ Load delivery summary
      const summaryRes = await fetch(
        "http://127.0.0.1:8000/api/delivery/today/summary/",
        { headers: authHeaders }
      );

      if (summaryRes.status === 401) {
        alert("Session expired. Login again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // ✅ Load delivery route
      const routeRes = await fetch(
        "http://127.0.0.1:8000/api/delivery/today/route/",
        { headers: authHeaders }
      );

      if (routeRes.status === 401) {
        alert("Session expired. Login again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const routeData = await routeRes.json();
      setStops(Array.isArray(routeData) ? routeData : []);

    } catch (error) {
      console.error("Error loading delivery data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box sx={{ padding: "30px" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 4 }}>
        Delivery Dashboard
      </Typography>

      {/* ✅ Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: "16px", padding: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Today's Summary
              </Typography>

              {!summary ? (
                <Typography sx={{ marginTop: 2 }}>Loading...</Typography>
              ) : (
                <Box sx={{ marginTop: 2 }}>
                  <Typography>Total Deliveries: {summary.total_deliveries}</Typography>
                  <Typography>Publications: {summary.publications}</Typography>
                  <Typography>Commission: ₹ {summary.commission}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ✅ Route */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: "16px", padding: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Today's Route
              </Typography>

              <Box sx={{ marginTop: 2 }}>
                {stops.length === 0 ? (
                  <Typography>No delivery stops found.</Typography>
                ) : (
                  stops.map((stop, index) => (
                    <Box
                      key={stop.id || `stop-${index}`}
                      sx={{
                        padding: "12px",
                        background: "#f4f4f4",
                        borderRadius: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, mb: 1 }}>
                        📍 Stop {index + 1}
                        {stop.customer_name && ` - ${stop.customer_name}`}
                      </Typography>
                      <Typography><strong>Address:</strong> {stop.address}</Typography>
                      <Typography>
                        <strong>Publications:</strong> {
                          Array.isArray(stop.publications) 
                            ? stop.publications.join(", ") 
                            : stop.publications || "None"
                        }
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {stop.status || "pending"}
                      </Typography>
                      {stop.id && (
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={async () => {
                            try {
                              const r = await fetch(
                                `http://127.0.0.1:8000/api/delivery/mark/${stop.id}/`,
                                {
                                  method: "POST",
                                  headers: authHeaders,
                                }
                              );
                              if (r.ok) {
                                alert("Marked as delivered!");
                                loadData();
                              } else {
                                alert("Failed to mark as delivered");
                              }
                            } catch (error) {
                              console.error("Error marking delivered:", error);
                              alert("Failed to mark as delivered");
                            }
                          }}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
