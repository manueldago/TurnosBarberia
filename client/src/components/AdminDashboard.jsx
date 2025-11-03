import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
  Chip,
  IconButton,
  Toolbar,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { adminListAppointments, adminAcceptAppointment, adminRejectAppointment, adminLogout } from '../api';
import CalendarSlots from './CalendarSlots';

export default function AdminDashboard({ onLoggedOut }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListAppointments();
      setRows(data);
    } catch (err) {
      setError(err.message || 'Error cargando turnos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    setBusyId(id);
    try {
      if (action === 'accept') await adminAcceptAppointment(id);
      else await adminRejectAppointment(id);
      await load();
    } catch (err) {
      setError(err.message || 'Acción fallida');
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    try {
      await adminLogout();
    } finally {
      onLoggedOut?.();
    }
  }

  function getStatusChip(status) {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'warning' },
      accepted: { label: 'Aceptado', color: 'success' },
      rejected: { label: 'Rechazado', color: 'error' }
    };
    const config = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ mt: 4, mb: 4 }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          <Typography variant="h5" component="h2">
            Administrador - Gestión de Turnos
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={load} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="secondary"
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Toolbar>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nombre Cliente</strong></TableCell>
                    <TableCell><strong>Tipo Corte</strong></TableCell>
                    <TableCell><strong>Fecha Turno</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acción</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No hay turnos registrados
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.client}</TableCell>
                        <TableCell>{r.service}</TableCell>
                        <TableCell>
                          {new Date(r.time).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </TableCell>
                        <TableCell>{getStatusChip(r.status)}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              disabled={busyId === r.id || r.status === 'accepted' || r.status === 'rejected'}
                              onClick={() => handleAction(r.id, 'accept')}
                            >
                              Aceptar
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              disabled={busyId === r.id || r.status === 'accepted' || r.status === 'rejected'}
                              onClick={() => handleAction(r.id, 'reject')}
                            >
                              Rechazar
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <CalendarSlots />
    </Container>
  );
}


