const { randomUUID } = require('crypto');

const appointments = [
  { id: randomUUID(), client: 'Juan Pérez', service: 'Corte clásico', time: '2025-11-04T09:00:00Z' },
  { id: randomUUID(), client: 'María Gómez', service: 'Afeitado', time: '2025-11-04T10:00:00Z' }
];

function listAppointments() {
  return [...appointments].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
}

function getAppointment(id) {
  return appointments.find((appointment) => appointment.id === id) ?? null;
}

function addAppointment({ client, service, time }) {
  const appointment = {
    id: randomUUID(),
    client,
    service,
    time
  };

  appointments.push(appointment);
  return appointment;
}

function removeAppointment(id) {
  const index = appointments.findIndex((appointment) => appointment.id === id);
  if (index === -1) {
    return false;
  }

  appointments.splice(index, 1);
  return true;
}

module.exports = {
  listAppointments,
  getAppointment,
  addAppointment,
  removeAppointment
};
