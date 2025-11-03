export async function getHealth() {
  const res = await fetch('/api/health', { credentials: 'include' });
  if (!res.ok) throw new Error('Error health');
  return res.json();
}

export async function listAppointmentsPublic() {
  const res = await fetch('/api/appointments', { credentials: 'include' });
  if (!res.ok) throw new Error('No fue posible obtener los turnos');
  return res.json();
}

export async function createAppointment({ client, service, time }) {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ client, service, time })
  });
  if (!res.ok) throw new Error('No fue posible crear el turno');
  return res.json();
}

export async function adminLogin({ username, password }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Credenciales inválidas');
  return res.json();
}

export async function adminLogout() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Error al cerrar sesión');
  return res.json();
}

export async function authMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Error de sesión');
  return res.json();
}

export async function meGetAppointment() {
  const res = await fetch('/api/me/appointment', { credentials: 'include' });
  if (!res.ok) throw new Error('Error obteniendo turno');
  return res.json();
}

export async function meCreateAppointment({ client, service, time }) {
  const res = await fetch('/api/me/appointment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ client, service, time })
  });
  if (!res.ok) throw new Error('Error creando turno');
  return res.json();
}

export async function adminCalendar() {
  const res = await fetch('/api/admin/calendar', { credentials: 'include' });
  if (!res.ok) throw new Error('Error obteniendo calendario');
  return res.json();
}

export async function adminListAppointments() {
  const res = await fetch('/api/admin/appointments', { credentials: 'include' });
  if (!res.ok) throw new Error('No autorizado o error listando turnos');
  return res.json();
}

export async function adminAcceptAppointment(id) {
  const res = await fetch(`/api/admin/appointments/${id}/accept`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('No fue posible aceptar');
  return res.json();
}

export async function adminRejectAppointment(id) {
  const res = await fetch(`/api/admin/appointments/${id}/reject`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('No fue posible rechazar');
  return res.json();
}


