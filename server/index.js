const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const appointments = [
  { id: 1, client: 'Juan Pérez', service: 'Corte clásico', time: '2025-11-04T09:00:00Z' },
  { id: 2, client: 'María Gómez', service: 'Afeitado', time: '2025-11-04T10:00:00Z' }
];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/appointments', (_req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { client, service, time } = req.body;

  if (!client || !service || !time) {
    return res.status(400).json({ message: 'Los campos client, service y time son obligatorios.' });
  }

  const appointment = {
    id: appointments.length + 1,
    client,
    service,
    time
  };

  appointments.push(appointment);
  res.status(201).json(appointment);
});

app.listen(PORT, () => {
  console.log(`API de Turnos Barbería escuchando en http://localhost:${PORT}`);
});
