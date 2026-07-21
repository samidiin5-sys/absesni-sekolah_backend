const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Validator = require('fastest-validator');
const { User } = require('../models');
const { response } = require('../helpers/response.formatter');

const v = new Validator();

const loginSchema = {
  email: { type: 'email', nullable: false },
  password: { type: 'string', min: 6, nullable: false }
};

const login = async (req, res) => {
  try {
    // 1. Validate request body
    const check = v.compile(loginSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { email, password } = req.body;

    // 2. Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json(response(401, 'Email atau password salah'));
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(response(401, 'Email atau password salah'));
    }

    // 4. Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET || 'sekolah_absensi_super_secret_jwt_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    );

    // 5. Send successful response (omit password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(200).json(response(200, 'Login berhasil', {
      token,
      user: userData
    }));

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  login
};
