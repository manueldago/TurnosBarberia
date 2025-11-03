import { useEffect, useState } from 'react';
import './App.css';

const SERVICES = [
  'Corte clásico',
  'Corte moderno',
  'Afeitado',
  'Perfilado de barba'
];

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/$/, '') : '';
const buildApiUrl = (path) => {
  if (!API_BASE_URL) {
    return path;
  }

  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  return new URL(path, normalizedBase).toString();
};

const sortAppointments = (items) =>
  [...items].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

const defaultDateTimeValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

function App() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('Cargando API...');
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(() => ({
    client: '',
    service: SERVICES[0],
    time: defaultDateTimeValue()
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchStatus() {
    try {
      const response = await fetch(buildApiUrl('/api/health'));
      if (!response.ok) {
        throw new Error('Error obteniendo estado del servidor');
      }
      const payload = await response.json();
      setStatus(`API disponible · ${new Date(payload.timestamp).toLocaleString()}`);
    } catch (err) {
      setStatus('API no disponible');
      setError(err.message);
    }
  }

  async function fetchAppointments() {
    try {
      const response = await fetch(buildApiUrl('/api/appointments'));
      if (!response.ok) {
        throw new Error('No fue posible obtener los turnos');
      }
      const data = await response.json();
      setAppointments(sortAppointments(data));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchStatus();
    fetchAppointments();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/appointments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? 'No fue posible crear el turno');
      }

      const appointment = await response.json();
      setAppointments((prev) => sortAppointments([...prev, appointment]));
      setFormData({ client: '', service: SERVICES[0], time: defaultDateTimeValue() });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (appointmentId) => {
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`/api/appointments/${appointmentId}`), {
        method: 'DELETE'
      });

      if (!response.ok) {
        let message = 'No fue posible eliminar el turno';
        try {
          const payload = await response.json();
          message = payload.message ?? message;
        } catch (parseError) {
          console.error('Error leyendo la respuesta de eliminación', parseError);
        }
        throw new Error(message);
      }

      setAppointments((prev) => prev.filter((appointment) => appointment.id !== appointmentId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Turnos Barbería</h1>
        <p className="app__status">{status}</p>
      </header>

      {error && <p className="app__error">{error}</p>}

      <section className="app__section">
        <h2>Agendar nuevo turno</h2>
        <form className="app__form" onSubmit={handleSubmit}>
          <label className="app__label">
            Cliente
            <input
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="Nombre y apellido"
              required
            />
          </label>

          <label className="app__label">
            Servicio
            <select name="service" value={formData.service} onChange={handleChange}>
              {SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </label>

          <label className="app__label">
            Fecha y hora
            <input
              type="datetime-local"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </label>

          <button className="app__button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar turno'}
          </button>
        </form>
      </section>

      <section className="app__section">
        <h2>Próximos turnos</h2>
        {appointments.length === 0 ? (
          <p>No hay turnos registrados.</p>
        ) : (
          <ul className="app__list">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="app__list-item">
                <div>
                  <h3>{appointment.client}</h3>
                  <p>{appointment.service}</p>
                  <time dateTime={appointment.time}>
                    {new Date(appointment.time).toLocaleString('es-AR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </time>
                </div>
                <button
                  type="button"
                  className="app__button app__button--secondary"
                  onClick={() => handleDelete(appointment.id)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
