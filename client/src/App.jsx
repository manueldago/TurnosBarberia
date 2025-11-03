import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('Cargando API...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/health');
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
        const response = await fetch('/api/appointments');
        if (!response.ok) {
          throw new Error('No fue posible obtener los turnos');
        }
        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchStatus();
    fetchAppointments();
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Turnos Barbería</h1>
        <p className="app__status">{status}</p>
      </header>

      {error && <p className="app__error">{error}</p>}

      <section className="app__section">
        <h2>Próximos turnos</h2>
        {appointments.length === 0 ? (
          <p>No hay turnos registrados.</p>
        ) : (
          <ul className="app__list">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="app__list-item">
                <h3>{appointment.client}</h3>
                <p>{appointment.service}</p>
                <time dateTime={appointment.time}>
                  {new Date(appointment.time).toLocaleString('es-AR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
