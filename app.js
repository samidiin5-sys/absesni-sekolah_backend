require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const { response } = require('./helpers/response.formatter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const teacherRoutes = require('./routes/teacher.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const multer = require('multer');
const upload = multer();

const app = express();
const PORT = process.env.PORT || 4000;

// Setup CORS — default allow all origins unless explicitly configured
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return upload.none()(req, res, next);
  }
  next();
});

// Initial endpoint
app.get('/', (req, res) => {
  return res.status(200).json(response(200, 'API Sistem Absensi Sekolah berjalan'));
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Handle 404 Not Found routes
app.use((req, res) => {
  return res.status(404).json(response(404, 'Endpoint tidak ditemukan'));
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  return res.status(500).json(response(500, 'Terjadi kesalahan internal pada server'));
});

// Jika bukan di Vercel (serverless), jalankan server biasa
if (process.env.VERCEL !== '1') {
  db.sequelize.authenticate()
    .then(() => {
      console.log('Database berhasil tersambung');
      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch(error => {
      console.error('Database gagal tersambung:', error.message);
      process.exit(1);
    });
}

// Export untuk Vercel serverless
module.exports = app;

