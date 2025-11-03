import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, Grid, TextField, Button, Alert, Stack, Chip } from '@mui/material';
import { meGetAppointment, meCreateAppointment } from '../api';

export default function Profile() {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ client: '', service: '', time: '' });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { appointment } = await meGetAppointment();
      setAppointment(appointment);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await meCreateAppointment(form);
      setForm({ client: '', service: '', time: '' });
      await load();
    } catch (e) {
      setError(e.message || 'No fue posible crear el turno');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Mi turno</Typography>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Typography>Cargando...</Typography>
          ) : appointment ? (
            <Stack spacing={1}>
              <Typography><strong>Cliente:</strong> {appointment.client}</Typography>
              <Typography><strong>Servicio:</strong> {appointment.service}</Typography>
              <Typography><strong>Fecha:</strong> {new Date(appointment.time).toLocaleString()}</Typography>
              <Chip label={appointment.status} color={appointment.status === 'accepted' ? 'success' : 'warning'} size="small" />
            </Stack>
          ) : (
            <Typography variant="body1" color="text.secondary">No tienes un turno activo.</Typography>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Solicitar nuevo turno</Typography>
          <Divider sx={{ mb: 2 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre" value={form.client} onChange={(e)=>setForm({ ...form, client: e.target.value })} required />
            <TextField label="Servicio" value={form.service} onChange={(e)=>setForm({ ...form, service: e.target.value })} required />
            <TextField label="Fecha y hora" type="datetime-local" value={form.time} onChange={(e)=>setForm({ ...form, time: e.target.value })} required InputLabelProps={{ shrink: true }} />
            <Button type="submit" variant="contained" disabled={creating}>Crear turno</Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}


