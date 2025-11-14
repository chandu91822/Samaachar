import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, TextField, Button, MenuItem, Alert, Stack
} from '@mui/material'
import { loginApi, registerApi } from '../api/auth'

const ROLES = [
  'manager',
  'customer',
  'delivery_boy',
  'customer_service_executive',
  'subscription_manager'
]

export default function AuthDialog({ open, onClose }) {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login state
  const [lUser, setLUser] = useState('')
  const [lPass, setLPass] = useState('')
  const [lRole, setLRole] = useState('manager')

  // Register state
  const [rUser, setRUser] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rPass2, setRPass2] = useState('')
  const [rRole, setRRole] = useState('customer')
  const [rHouseNumber, setRHouseNumber] = useState('')

  const handleLogin = async () => {
    setError(''); setLoading(true)
    try {
      const { data } = await loginApi({ username: lUser, password: lPass, role: lRole })
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('username', data.username)
      localStorage.setItem('role', data.role)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    setError('')
    if (rPass !== rPass2) { setError('Passwords do not match'); return }
    if (rRole === 'customer' && !rHouseNumber.trim()) { 
      setError('House number is required for customers'); 
      return 
    }
    setLoading(true)
    try {
      const registerData = { 
        username: rUser, 
        email: rEmail, 
        password: rPass, 
        confirmPassword: rPass2, 
        role: rRole 
      }
      if (rRole === 'customer' && rHouseNumber) {
        registerData.house_number = rHouseNumber
      }
      await registerApi(registerData)
      setTab(0) // back to login
      setRHouseNumber('') // Reset house number
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Welcome to Samaachar</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }} centered>
          <Tab label="Login" /><Tab label="Register" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Username" value={lUser} onChange={e => setLUser(e.target.value)} fullWidth />
            <TextField label="Password" type="password" value={lPass} onChange={e => setLPass(e.target.value)} fullWidth />
            <TextField select label="Role" value={lRole} onChange={e => setLRole(e.target.value)}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{r.replaceAll('_',' ')}</MenuItem>)}
            </TextField>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={onClose} disabled={loading} fullWidth>Cancel</Button>
              <Button variant="contained" onClick={handleLogin} disabled={loading} fullWidth>Login</Button>
            </Stack>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField label="Username" value={rUser} onChange={e => setRUser(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={rEmail} onChange={e => setREmail(e.target.value)} fullWidth />
            <TextField label="Password" type="password" value={rPass} onChange={e => setRPass(e.target.value)} fullWidth />
            <TextField label="Confirm Password" type="password" value={rPass2} onChange={e => setRPass2(e.target.value)} fullWidth />
            <TextField select label="Role" value={rRole} onChange={e => setRRole(e.target.value)}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{r.replaceAll('_',' ')}</MenuItem>)}
            </TextField>
            {rRole === 'customer' && (
              <TextField 
                label="House Number" 
                value={rHouseNumber} 
                onChange={e => setRHouseNumber(e.target.value)} 
                fullWidth 
                required
                placeholder="Enter your house number"
              />
            )}
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => setTab(0)} disabled={loading} fullWidth>Back to Login</Button>
              <Button variant="contained" onClick={handleRegister} disabled={loading} fullWidth>Register</Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
