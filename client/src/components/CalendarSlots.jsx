import { useEffect, useMemo, useState } from 'react';
import { Paper, Typography, Box, Grid, Chip, IconButton, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { adminCalendar } from '../api';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const START_HOUR = 9;
const END_HOUR = 18;

export default function CalendarSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await adminCalendar();
      setSlots(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const grid = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    // Construir 7 días a partir del lunes de esta semana
    const day = start.getDay(); // 0-6 (domingo-sábado)
    const diffToMonday = ((day + 6) % 7);
    const monday = new Date(start);
    monday.setDate(start.getDate() - diffToMonday);

    const days = Array.from({ length: 6 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    // Indexar reservas por día/hora
    const byKey = new Map();
    for (const appt of slots) {
      const t = new Date(appt.time);
      const key = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}-${t.getHours()}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(appt);
    }
    return { days, hours, byKey };
  }, [slots]);

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Calendario semanal</Typography>
        <IconButton onClick={load} disabled={loading} color="primary"><RefreshIcon /></IconButton>
      </Stack>
      <Grid container spacing={1}>
        <Grid item xs={2} />
        {DAYS.map(d => (
          <Grid key={d} item xs={2}>
            <Typography align="center" variant="subtitle2">{d}</Typography>
          </Grid>
        ))}
        {grid.hours.map(h => (
          <>
            <Grid item xs={2} key={`h-${h}`}>
              <Typography variant="caption">{h}:00</Typography>
            </Grid>
            {grid.days.map((dt, idx) => {
              const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${h}`;
              const appts = grid.byKey.get(key) || [];
              return (
                <Grid item xs={2} key={`s-${h}-${idx}`}>
                  <Box sx={{ minHeight: 40, p: 0.5, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 1 }}>
                    {appts.length === 0 ? (
                      <Typography variant="caption" color="text.disabled">Libre</Typography>
                    ) : appts.map(a => (
                      <Chip key={a.id} label={`${a.client} • ${new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} size="small" color={a.status === 'accepted' ? 'success' : 'warning'} sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Grid>
              );
            })}
          </>
        ))}
      </Grid>
    </Paper>
  );
}


