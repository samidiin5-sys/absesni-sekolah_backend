const bcrypt = require('bcrypt');
const Validator = require('fastest-validator');
const { User } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const v = new Validator();

const teacherSchema = {
  name: { type: 'string', min: 1, empty: false },
  nip: { type: 'string', min: 1, empty: false },
  email: { type: 'email' },
  password: { type: 'string', min: 6 }
};

const updateTeacherSchema = {
  name: { type: 'string', min: 1, empty: false, optional: true },
  nip: { type: 'string', min: 1, empty: false, optional: true },
  email: { type: 'email', optional: true },
  password: { type: 'string', min: 6, optional: true }
};

// GET all teachers
const getAllTeachers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;

    // Filter to only get users with role = 'teacher'
    let whereCondition = {
      role: 'teacher'
    };

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nip: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [[sortBy, sortOrder]]
    });

    const totalPage = Math.ceil(count / limit);

    return res.status(200).json(response(200, 'Data guru berhasil diambil', {
      teachers: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage
      }
    }));
  } catch (error) {
    console.error('Get All Teachers Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// GET teacher detail
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await User.findOne({
      where: {
        id,
        role: 'teacher'
      },
      attributes: { exclude: ['password'] }
    });

    if (!teacher) {
      return res.status(404).json(response(404, 'Guru tidak ditemukan'));
    }

    return res.status(200).json(response(200, 'Detail guru berhasil diambil', teacher));
  } catch (error) {
    console.error('Get Teacher By Id Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// POST create teacher
const createTeacher = async (req, res) => {
  try {
    const check = v.compile(teacherSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { name, nip, email, password } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(409).json(response(409, 'Email sudah digunakan'));
    }

    // Check if NIP already exists
    const nipExists = await User.findOne({ where: { nip } });
    if (nipExists) {
      return res.status(409).json(response(409, 'NIP sudah digunakan'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await User.create({
      name,
      nip,
      email,
      password: hashedPassword,
      role: 'teacher' // Force role to teacher
    });

    // Remove password from returned data
    const teacherData = newTeacher.toJSON();
    delete teacherData.password;

    return res.status(201).json(response(201, 'Guru berhasil ditambahkan', teacherData));
  } catch (error) {
    console.error('Create Teacher Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// PUT update teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const check = v.compile(updateTeacherSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const teacher = await User.findOne({
      where: {
        id,
        role: 'teacher'
      }
    });

    if (!teacher) {
      return res.status(404).json(response(404, 'Guru tidak ditemukan'));
    }

    const { name, nip, email, password } = req.body;

    // Check if email already exists for another user
    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(409).json(response(409, 'Email sudah digunakan'));
      }
    }

    // Check if NIP already exists for another user
    if (nip && nip !== teacher.nip) {
      const nipExists = await User.findOne({ where: { nip } });
      if (nipExists) {
        return res.status(409).json(response(409, 'NIP sudah digunakan'));
      }
    }

    const updatedData = {
      name: name || teacher.name,
      nip: nip || teacher.nip,
      email: email || teacher.email
    };

    // Hash new password if provided
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await teacher.update(updatedData);

    const teacherData = teacher.toJSON();
    delete teacherData.password;

    return res.status(200).json(response(200, 'Guru berhasil diperbarui', teacherData));
  } catch (error) {
    console.error('Update Teacher Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// DELETE teacher
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await User.findOne({
      where: {
        id,
        role: 'teacher'
      }
    });

    if (!teacher) {
      return res.status(404).json(response(404, 'Guru tidak ditemukan'));
    }

    await teacher.destroy();
    return res.status(200).json(response(200, 'Guru berhasil dihapus'));
  } catch (error) {
    console.error('Delete Teacher Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
