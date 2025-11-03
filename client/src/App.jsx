import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  TextField,
  Stack,
  IconButton,
  Chip,
  Grid,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  ContentCut as CutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import AdminLogin from './components/AdminLogin';
import AuthLogin from './components/AuthLogin';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import { listAppointmentsPublic, createAppointment, getHealth, authMe, adminLogout } from './api';

function App() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('Cargando API...');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('public'); // 'public' | 'login' | 'admin' | 'auth' | 'profile'
  const [form, setForm] = useState({ client: '', service: '', time: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState(null); // { id, username, isAdmin }

  async function fetchStatus() {
    try {
      const payload = await getHealth();
      setStatus(`API disponible · ${new Date(payload.timestamp).toLocaleString()}`);
    } catch (err) {
      setStatus('API no disponible');
      setError(err.message);
    }
  }

  async function fetchAppointments() {
    setRefreshing(true);
    try {
      const data = await listAppointmentsPublic();
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    fetchAppointments();
    (async () => {
      try {
        const { user } = await authMe();
        setMe(user);
      } catch {}
    })();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createAppointment(form);
      setForm({ client: '', service: '', time: '' });
      await fetchAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className={!me ? 'body-logged-out' : ''}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <CutIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Turnos Barbería
          </Typography>
          <Typography variant="caption" sx={{ mr: 2, opacity: 0.8 }}>
            {status}
          </Typography>
          <Stack direction="row" spacing={1}>
            {!me && view !== 'auth' && (
              <Button color="inherit" startIcon={<AdminIcon />} onClick={() => setView('auth')}>Login</Button>
            )}
            {me && !me.isAdmin && view !== 'profile' && (
              <Button color="inherit" startIcon={<HomeIcon />} onClick={() => setView('profile')}>Perfil</Button>
            )}
            {me && me.isAdmin && view !== 'admin' && (
              <Button color="inherit" startIcon={<AdminIcon />} onClick={() => setView('admin')}>Admin</Button>
            )}
            {view !== 'public' && (
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                onClick={() => setView('public')}
              >
                Público
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, py: 4 }}>
        {error && (
          <Container maxWidth="lg" sx={{ mb: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Container>
        )}

        {view === 'auth' && (
          <AuthLogin onLoggedIn={async () => {
            const { user } = await authMe();
            setMe(user);
            setView(user?.isAdmin ? 'admin' : 'profile');
          }} />
        )}

        {view === 'admin' && (
          <AdminDashboard onLoggedOut={async () => {
            await adminLogout();
            setMe(null);
            setView('public');
          }} />
        )}

        {view === 'profile' && <Container maxWidth="lg"><Profile /></Container>}

        {view === 'public' && (
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              {/* Lista de turnos */}
              <Grid item xs={12} md={7}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 0 }}>
                      Próximos Turnos
                    </Typography>
                    <IconButton
                      color="primary"
                      onClick={fetchAppointments}
                      disabled={refreshing}
                      aria-label="refrescar"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  {appointments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No hay turnos registrados
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {appointments.map((appointment) => (
                        <Grid item xs={12} key={appointment.id}>
                          <Card variant="outlined" sx={{ '&:hover': { boxShadow: 4 } }}>
                            <CardContent>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <PersonIcon color="primary" />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="h6" component="h3">
                                    {appointment.client}
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                    <CutIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {appointment.service}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                    <CalendarIcon fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(appointment.time).toLocaleString('es-AR', {
                                        dateStyle: 'full',
                                        timeStyle: 'short'
                                      })}
                                    </Typography>
                                  </Stack>
                                </Box>
                                <Chip
                                  label={appointment.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                                  color={appointment.status === 'accepted' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid>

              {/* Formulario de solicitud */}
              <Grid item xs={12} md={5}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Solicitar Turno
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Nombre Cliente"
                      value={form.client}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      label="Tipo de Corte"
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CutIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      label="Fecha y Hora"
                      type="datetime-local"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? 'Creando...' : 'Crear Turno'}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        )}
      </Box>
    </Box>
  );
}

export default App;
