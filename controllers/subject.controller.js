const Validator = require('fastest-validator');
const { Subject, User, Attendance } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const v = new Validator();

const subjectSchema = {
  code: { type: 'string', min: 1, empty: false },
  name: { type: 'string', min: 1, empty: false },
  teacherId: { type: 'number', integer: true, positive: true, optional: true }
};

const updateSubjectSchema = {
  code: { type: 'string', min: 1, empty: false, optional: true },
  name: { type: 'string', min: 1, empty: false, optional: true },
  teacherId: { type: 'number', integer: true, positive: true, optional: true, nullable: true }
};

// GET all subjects
const getAllSubjects = async (req, res) => {
  try {
    const search = req.query.search || '';
    const teacherId = req.query.teacherId ? parseInt(req.query.teacherId) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (search) {
      whereCondition[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (teacherId) {
      whereCondition.teacherId = teacherId;
    }

    const { count, rows } = await Subject.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'nip', 'email', 'role']
        }
      ]
    });

    const totalPage = Math.ceil(count / limit);

    return res.status(200).json(response(200, 'Data mata pelajaran berhasil diambil', {
      subjects: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage
      }
    }));
  } catch (error) {
    console.error('Get All Subjects Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// GET subject detail
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'nip', 'email', 'role']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json(response(404, 'Mata pelajaran tidak ditemukan'));
    }

    return res.status(200).json(response(200, 'Detail mata pelajaran berhasil diambil', subject));
  } catch (error) {
    console.error('Get Subject By Id Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// POST create subject
const createSubject = async (req, res) => {
  try {
    if (req.body.teacherId !== undefined && req.body.teacherId !== null) {
      req.body.teacherId = Number(req.body.teacherId);
    }

    const check = v.compile(subjectSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { code, name, teacherId } = req.body;

    // Check code uniqueness
    const codeExists = await Subject.findOne({ where: { code } });
    if (codeExists) {
      return res.status(409).json(response(409, 'Kode mata pelajaran sudah digunakan'));
    }

    // Verify teacher exists and has the role of teacher
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json(response(404, 'Guru tidak ditemukan atau user bukan ber-role guru'));
      }
    }

    const newSubject = await Subject.create({
      code,
      name,
      teacherId
    });

    return res.status(201).json(response(201, 'Mata pelajaran berhasil ditambahkan', newSubject));
  } catch (error) {
    console.error('Create Subject Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// PUT update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.teacherId !== undefined && req.body.teacherId !== null) {
      req.body.teacherId = Number(req.body.teacherId);
    }

    const check = v.compile(updateSubjectSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json(response(404, 'Mata pelajaran tidak ditemukan'));
    }

    const { code, name, teacherId } = req.body;

    // Check code uniqueness if changed
    if (code && code !== subject.code) {
      const codeExists = await Subject.findOne({ where: { code } });
      if (codeExists) {
        return res.status(409).json(response(409, 'Kode mata pelajaran sudah digunakan'));
      }
    }

    // Verify teacher if changed
    if (teacherId && teacherId !== subject.teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json(response(404, 'Guru tidak ditemukan atau user bukan ber-role guru'));
      }
    }

    await subject.update({
      code: code || subject.code,
      name: name || subject.name,
      teacherId: teacherId === null ? null : (teacherId || subject.teacherId)
    });

    return res.status(200).json(response(200, 'Mata pelajaran berhasil diperbarui', subject));
  } catch (error) {
    console.error('Update Subject Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// DELETE subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json(response(404, 'Mata pelajaran tidak ditemukan'));
    }

    // Check if subject is used in attendance records
    const attendanceCount = await Attendance.count({ where: { subjectId: id } });
    if (attendanceCount > 0) {
      return res.status(409).json(response(409, 'Mata pelajaran tidak boleh dihapus karena sudah digunakan dalam data absensi'));
    }

    await subject.destroy();
    return res.status(200).json(response(200, 'Mata pelajaran berhasil dihapus'));
  } catch (error) {
    console.error('Delete Subject Error:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json(response(409, 'Mata pelajaran tidak boleh dihapus karena masih digunakan oleh data lain'));
    }
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
