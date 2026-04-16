const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

// ✔️ CORRECCIÓN IMPORTANTE (ruta frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Config DB
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'medaclinic'
});

// Middleware Auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token requerido' });

    jwt.verify(token, 'medaclinic_secret_2024', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// ✅ LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {

            if (err || results.length === 0) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const user = results[0];

            // ✔️ comparación simple (como ya estás usando texto plano)
            const validPass = (password === user.password);

            if (!validPass) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                'medaclinic_secret_2024',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email
                }
            });
        }
    );
});

// ✅ REGISTRO
app.post('/api/register', (req, res) => {
    const { username, password, email, role } = req.body;

    db.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, results) => {

            if (results.length > 0) {
                return res.status(400).json({ error: 'Usuario ya existe' });
            }

            bcrypt.hash(password, 10, (err, hash) => {
                db.query(
                    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                    [username, hash, email, role || 'patient'],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Error al registrar' });
                        }

                        res.json({ success: true, message: 'Usuario creado' });
                    }
                );
            });
        }
    );
});

// ✅ PERFIL
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ✅ DASHBOARD
app.get('/api/dashboard', authenticateToken, (req, res) => {
    const role = req.user.role;

    if (role === 'admin') {
        res.json({
            stats: {
                totalUsers: 25,
                doctors: 8,
                patients: 15,
                appointments: 120
            }
        });
    } else {
        res.json({
            stats: {
                appointments: 12,
                patients: role === 'doctor' ? 45 : 0
            }
        });
    }
});

// ✔️ SERVER
app.listen(3000, () => {
    console.log('🚀 Medaclinic Backend: http://localhost:3000');
});