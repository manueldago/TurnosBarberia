const express = require('express');
const cors = require('cors');

const {
  listAppointments,
  getAppointment,
  addAppointment,
  removeAppointment
} = require('./appointmentsStore');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/appointments', (_req, res) => {
  res.json(listAppointments());
});

app.get('/api/appointments/:id', (req, res) => {
  const appointment = getAppointment(req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: 'Turno no encontrado.' });
  }

  res.json(appointment);
});

app.post('/api/appointments', (req, res) => {
  const { client, service, time } = req.body;

  if (!client || !service || !time) {
    return res.status(400).json({ message: 'Los campos client, service y time son obligatorios.' });
  }

  const parsedTime = Date.parse(time);
  if (Number.isNaN(parsedTime)) {
    return res.status(400).json({ message: 'El campo time debe ser una fecha válida.' });
  }

  const appointment = addAppointment({ client, service, time: new Date(parsedTime).toISOString() });
  res.status(201).json(appointment);
});

app.delete('/api/appointments/:id', (req, res) => {
  const removed = removeAppointment(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: 'Turno no encontrado.' });
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API de Turnos Barbería escuchando en http://localhost:${PORT}`);
});
