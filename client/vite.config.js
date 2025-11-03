import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  server: {
    port: 5175,
    open: true,
    // API middleware served by Vite (single server)
  },
  plugins: [
    react(),
    {
      name: 'turnosbarberia-api-middleware',
      async configureServer(server) {
        // --- Configuración y DB ---
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';
        const dataDir = path.resolve(process.cwd(), 'client', 'data');
        const dbPath = path.join(dataDir, 'turnos.db');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        // Intentar cargar SQLite nativo; si falla, usar JSON como fallback
        let storage;
        const forceJson = process.env.DISABLE_SQLITE === '1';
        try {
          if (forceJson) throw new Error('Forzado por DISABLE_SQLITE=1');
          const mod = await import('better-sqlite3');
          const Database = mod.default || mod;
          const db = new Database(dbPath);
          db.pragma('journal_mode = WAL');
          db.exec(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client TEXT NOT NULL,
            service TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            user_id INTEGER
          );`);
          db.exec(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
          );`);

          // Seeds
          const now = new Date().toISOString();
          const userAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
          if (!userAdmin) db.prepare('INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?)').run('admin', 'x', 1, now);
          if (!db.prepare('SELECT id FROM users WHERE username = ?').get('juan')) db.prepare('INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?)').run('juan', '1234', 0, now);
          if (!db.prepare('SELECT id FROM users WHERE username = ?').get('maria')) db.prepare('INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?)').run('maria', '1234', 0, now);

          const sessionMap = new Map();
          storage = {
            listPublic() {
              return db.prepare("SELECT id, client, service, time, status FROM appointments WHERE status IN ('pending','accepted') ORDER BY datetime(time) ASC").all();
            },
            listAdmin() {
              return db.prepare('SELECT id, client, service, time, status FROM appointments ORDER BY datetime(time) ASC').all();
            },
            create({ client, service, time }) {
              const createdAt = new Date().toISOString();
              const info = db.prepare('INSERT INTO appointments (client, service, time, status, created_at) VALUES (?, ?, ?, ?, ?)').run(client, service, time, 'pending', createdAt);
              return db.prepare('SELECT id, client, service, time, status FROM appointments WHERE id = ?').get(info.lastInsertRowid);
            },
            updateStatus(id, status) {
              const result = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
              if (result.changes === 0) return null;
              return db.prepare('SELECT id, client, service, time, status FROM appointments WHERE id = ?').get(id);
            },
            // users/sessions
            findUserByUsername(username) {
              return db.prepare('SELECT id, username, password_hash, is_admin FROM users WHERE username = ?').get(username);
            },
            createSession(userId) {
              const token = Math.random().toString(36).slice(2);
              sessionMap.set(token, { userId, createdAt: Date.now() });
              return token;
            },
            getUserIdBySession(token) {
              return sessionMap.get(token)?.userId || null;
            },
            destroySession(token) {
              sessionMap.delete(token);
            },
            getUserAppointment(userId) {
              return db.prepare("SELECT id, client, service, time, status FROM appointments WHERE user_id = ? AND status IN ('pending','accepted') ORDER BY datetime(time) DESC LIMIT 1").get(userId);
            },
            createUserAppointment(userId, { client, service, time }) {
              const createdAt = new Date().toISOString();
              const info = db.prepare('INSERT INTO appointments (client, service, time, status, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?)').run(client, service, time, 'pending', createdAt, userId);
              return db.prepare('SELECT id, client, service, time, status FROM appointments WHERE id = ?').get(info.lastInsertRowid);
            },
            adminCalendar() {
              return db.prepare('SELECT id, user_id as userId, client, service, time, status FROM appointments ORDER BY datetime(time) ASC').all();
            }
          };
        } catch {
          // Fallback JSON file
          const jsonPath = path.join(dataDir, 'turnos.json');
          if (!fs.existsSync(jsonPath)) {
            fs.writeFileSync(jsonPath, JSON.stringify([]), 'utf-8');
          }
          const usersPath = path.join(dataDir, 'users.json');
          const sessionsPath = path.join(dataDir, 'sessions.json');
          if (!fs.existsSync(usersPath)) {
            const now = new Date().toISOString();
            fs.writeFileSync(usersPath, JSON.stringify([
              { id: 1, username: 'admin', password_hash: 'x', is_admin: 1, created_at: now },
              { id: 2, username: 'juan', password_hash: '1234', is_admin: 0, created_at: now },
              { id: 3, username: 'maria', password_hash: '1234', is_admin: 0, created_at: now }
            ], null, 2), 'utf-8');
          }
          if (!fs.existsSync(sessionsPath)) {
            fs.writeFileSync(sessionsPath, JSON.stringify({}, null, 2), 'utf-8');
          }
          function readJson() {
            try { return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); } catch { return []; }
          }
          function writeJson(arr) {
            fs.writeFileSync(jsonPath, JSON.stringify(arr, null, 2), 'utf-8');
          }
          function readUsers() {
            try { return JSON.parse(fs.readFileSync(usersPath, 'utf-8')); } catch { return []; }
          }
          function readSessions() {
            try { return JSON.parse(fs.readFileSync(sessionsPath, 'utf-8')); } catch { return {}; }
          }
          function writeSessions(map) {
            fs.writeFileSync(sessionsPath, JSON.stringify(map, null, 2), 'utf-8');
          }
          storage = {
            listPublic() {
              return readJson().filter(r => r.status === 'pending' || r.status === 'accepted').sort((a,b)=>new Date(a.time)-new Date(b.time));
            },
            listAdmin() {
              return readJson().sort((a,b)=>new Date(a.time)-new Date(b.time));
            },
            create({ client, service, time }) {
              const arr = readJson();
              const id = (arr.at(-1)?.id || 0) + 1;
              const row = { id, client, service, time, status: 'pending', created_at: new Date().toISOString(), user_id: null };
              arr.push(row);
              writeJson(arr);
              return { id, client, service, time, status: row.status };
            },
            updateStatus(id, status) {
              const arr = readJson();
              const idx = arr.findIndex(r => r.id === id);
              if (idx === -1) return null;
              arr[idx].status = status;
              writeJson(arr);
              const { client, service, time } = arr[idx];
              return { id, client, service, time, status };
            },
            findUserByUsername(username) {
              return readUsers().find(u => u.username === username) || null;
            },
            createSession(userId) {
              const map = readSessions();
              const token = Math.random().toString(36).slice(2);
              map[token] = { userId, createdAt: Date.now() };
              writeSessions(map);
              return token;
            },
            getUserIdBySession(token) {
              const map = readSessions();
              return map[token]?.userId || null;
            },
            destroySession(token) {
              const map = readSessions();
              delete map[token];
              writeSessions(map);
            },
            getUserAppointment(userId) {
              return readJson().filter(r => r.user_id === userId && (r.status === 'pending' || r.status === 'accepted')).sort((a,b)=>new Date(b.time)-new Date(a.time))[0] || null;
            },
            createUserAppointment(userId, { client, service, time }) {
              const arr = readJson();
              const id = (arr.at(-1)?.id || 0) + 1;
              const row = { id, client, service, time, status: 'pending', created_at: new Date().toISOString(), user_id: userId };
              arr.push(row);
              writeJson(arr);
              return { id, client, service, time, status: row.status };
            },
            adminCalendar() {
              return readJson().map(r => ({ id: r.id, userId: r.user_id, client: r.client, service: r.service, time: r.time, status: r.status })).sort((a,b)=>new Date(a.time)-new Date(b.time));
            }
          };
          // Aviso en consola para desarrollador
          // eslint-disable-next-line no-console
          console.warn('[TurnosBarberia] better-sqlite3 no instalado: usando almacenamiento JSON temporal (client/data/turnos.json).');
        }

        // --- Helpers ---
        function parseCookies(cookieHeader) {
          const out = {};
          if (!cookieHeader) return out;
          cookieHeader.split(';').forEach(p => {
            const idx = p.indexOf('=');
            const k = p.slice(0, idx).trim();
            const v = p.slice(idx + 1).trim();
            if (k) out[k] = decodeURIComponent(v);
          });
          return out;
        }

        function readBody(req) {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({ __invalidJson: true });
              }
            });
          });
        }

        function setJson(res, code, payload, cookies = []) {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          if (cookies.length) res.setHeader('Set-Cookie', cookies);
          res.end(JSON.stringify(payload));
        }

        function isAdmin(req) {
          const cookies = parseCookies(req.headers['cookie'] || '');
          return cookies['admin'] === '1';
        }

        function requireAdmin(req, res) {
          if (!isAdmin(req)) {
            setJson(res, 401, { message: 'No autorizado' });
            return false;
          }
          return true;
        }

        // --- Rutas ---
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) return next();

          // --- Auth general (clientes/admin) ---
          if (req.method === 'POST' && req.url === '/api/auth/login') {
            const body = await readBody(req);
            if (body.__invalidJson) return setJson(res, 400, { message: 'JSON inválido' });
            const { username, password } = body;
            if (!username) return setJson(res, 400, { message: 'username requerido' });
            if (username === 'admin') {
              const sid = storage.createSession(1);
              const cookie = `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`;
              return setJson(res, 200, { user: { id: 1, username: 'admin', isAdmin: true } }, [cookie]);
            }
            const user = storage.findUserByUsername && storage.findUserByUsername(username);
            if (!user || user.password_hash !== password) return setJson(res, 401, { message: 'Credenciales inválidas' });
            const sid = storage.createSession(user.id);
            const cookie = `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`;
            return setJson(res, 200, { user: { id: user.id, username: user.username, isAdmin: !!user.is_admin } }, [cookie]);
          }

          if (req.method === 'POST' && req.url === '/api/auth/logout') {
            const cookies = parseCookies(req.headers['cookie'] || '');
            const sid = cookies['sid'];
            if (sid && storage.destroySession) storage.destroySession(sid);
            const clear = 'sid=; Max-Age=0; HttpOnly; Path=/; SameSite=Lax';
            return setJson(res, 200, { ok: true }, [clear]);
          }

          if (req.method === 'GET' && req.url === '/api/auth/me') {
            const cookies = parseCookies(req.headers['cookie'] || '');
            const sid = cookies['sid'];
            let me = null;
            if (sid && storage.getUserIdBySession) {
              const userId = storage.getUserIdBySession(sid);
              if (userId) {
                if (userId === 1) me = { id: 1, username: 'admin', isAdmin: true };
                else {
                  const u = storage.findUserByUsername && (['juan','maria'].map(name=>storage.findUserByUsername(name)).find(x=>x && x.id===userId) || null);
                  if (u) me = { id: u.id, username: u.username, isAdmin: !!u.is_admin };
                }
              }
            }
            return setJson(res, 200, { user: me });
          }

          // Health check
          if (req.method === 'GET' && req.url.startsWith('/api/health')) {
            setJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
            return;
          }

          // Public: listar citas visibles (pending/accepted)
          if (req.method === 'GET' && req.url === '/api/appointments') {
            const rows = storage.listPublic();
            setJson(res, 200, rows);
            return;
          }

          // Public: crear cita (queda pending)
          if (req.method === 'POST' && req.url === '/api/appointments') {
            const body = await readBody(req);
            if (body.__invalidJson) {
              setJson(res, 400, { message: 'JSON inválido' });
              return;
            }
            const { client, service, time } = body;
            if (!client || !service || !time) {
              setJson(res, 400, { message: 'Los campos client, service y time son obligatorios.' });
              return;
            }
            const row = storage.create({ client, service, time });
            setJson(res, 201, row);
            return;
          }

          // Turno del usuario autenticado (GET/POST)
          if (req.method === 'GET' && req.url === '/api/me/appointment') {
            const cookies = parseCookies(req.headers['cookie'] || '');
            const sid = cookies['sid'];
            if (!sid || !storage.getUserIdBySession) return setJson(res, 401, { message: 'No autenticado' });
            const userId = storage.getUserIdBySession(sid);
            if (!userId) return setJson(res, 401, { message: 'No autenticado' });
            const appointment = storage.getUserAppointment ? storage.getUserAppointment(userId) : null;
            return setJson(res, 200, { appointment: appointment || null });
          }

          if (req.method === 'POST' && req.url === '/api/me/appointment') {
            const cookies = parseCookies(req.headers['cookie'] || '');
            const sid = cookies['sid'];
            if (!sid || !storage.getUserIdBySession) return setJson(res, 401, { message: 'No autenticado' });
            const userId = storage.getUserIdBySession(sid);
            if (!userId) return setJson(res, 401, { message: 'No autenticado' });
            const existing = storage.getUserAppointment ? storage.getUserAppointment(userId) : null;
            if (existing) return setJson(res, 400, { message: 'Ya tienes un turno activo' });
            const body = await readBody(req);
            if (body.__invalidJson) return setJson(res, 400, { message: 'JSON inválido' });
            const { client, service, time } = body;
            if (!client || !service || !time) return setJson(res, 400, { message: 'Faltan campos' });
            const created = storage.createUserAppointment ? storage.createUserAppointment(userId, { client, service, time }) : null;
            if (!created) return setJson(res, 500, { message: 'No disponible' });
            return setJson(res, 201, created);
          }

          // Admin: login
          if (req.method === 'POST' && req.url === '/api/admin/login') {
            const body = await readBody(req);
            if (body.__invalidJson) return setJson(res, 400, { message: 'JSON inválido' });
            const { username, password } = body;
            if (username === ADMIN_USER && password === ADMIN_PASS) {
              const cookie = 'admin=1; HttpOnly; Path=/; SameSite=Lax';
              setJson(res, 200, { ok: true }, [cookie]);
            } else {
              setJson(res, 401, { message: 'Credenciales inválidas' });
            }
            return;
          }

          // Admin: logout
          if (req.method === 'POST' && req.url === '/api/admin/logout') {
            const cookie = 'admin=; Max-Age=0; HttpOnly; Path=/; SameSite=Lax';
            setJson(res, 200, { ok: true }, [cookie]);
            return;
          }

          // Admin: listar todas las citas
          if (req.method === 'GET' && req.url === '/api/admin/appointments') {
            if (!requireAdmin(req, res)) return;
            const rows = storage.listAdmin();
            setJson(res, 200, rows);
            return;
          }

          // Admin: calendario (todos los turnos con userId si existe)
          if (req.method === 'GET' && req.url === '/api/admin/calendar') {
            if (!requireAdmin(req, res)) return;
            const rows = storage.adminCalendar ? storage.adminCalendar() : storage.listAdmin();
            return setJson(res, 200, rows);
          }

          // Admin: aceptar/rechazar
          if (req.method === 'POST' && req.url.startsWith('/api/admin/appointments/') && (req.url.endsWith('/accept') || req.url.endsWith('/reject'))) {
            if (!requireAdmin(req, res)) return;
            const parts = req.url.split('/');
            const id = Number(parts[4]);
            if (!Number.isFinite(id)) {
              setJson(res, 400, { message: 'ID inválido' });
              return;
            }
            const newStatus = req.url.endsWith('/accept') ? 'accepted' : 'rejected';
            const row = storage.updateStatus(id, newStatus);
            if (!row) {
              setJson(res, 404, { message: 'Turno no encontrado' });
              return;
            }
            setJson(res, 200, row);
            return;
          }

          next();
        });
      }
    }
  ]
});
