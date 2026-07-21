const Validator = require('fastest-validator');
const { Student, Class } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const v = new Validator();

const studentSchema = {
  nis: { type: 'string', min: 1, empty: false },
  fullName: { type: 'string', min: 1, empty: false },
  gender: { type: 'enum', values: ['male', 'female'] },
  classId: { type: 'number', integer: true, positive: true }
};

const updateStudentSchema = {
  nis: { type: 'string', min: 1, empty: false, optional: true },
  fullName: { type: 'string', min: 1, empty: false, optional: true },
  gender: { type: 'enum', values: ['male', 'female'], optional: true },
  classId: { type: 'number', integer: true, positive: true, optional: true }
};

// GET all students
const getAllStudents = async (req, res) => {
  try {
    const search = req.query.search || '';
    const classId = req.query.classId ? parseInt(req.query.classId) : null;
    const gender = req.query.gender || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'fullName';
    const sortOrder = req.query.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;

    // Build filter condition
    let whereCondition = {};

    if (search) {
      whereCondition[Op.or] = [
        { nis: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } }
      ];
    }

    if (classId) {
      whereCondition.classId = classId;
    }

    if (gender) {
      whereCondition.gender = gender;
    }

    const { count, rows } = await Student.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'major', 'grade', 'schoolYear']
        }
      ]
    });

    const totalPage = Math.ceil(count / limit);

    return res.status(200).json(response(200, 'Data siswa berhasil diambil', {
      students: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage
      }
    }));
  } catch (error) {
    console.error('Get All Students Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// GET student detail
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'class'
        }
      ]
    });

    if (!student) {
      return res.status(404).json(response(404, 'Siswa tidak ditemukan'));
    }

    return res.status(200).json(response(200, 'Detail siswa berhasil diambil', student));
  } catch (error) {
    console.error('Get Student By Id Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// POST create student
const createStudent = async (req, res) => {
  try {
    if (req.body.classId !== undefined) {
      req.body.classId = Number(req.body.classId);
    }

    const check = v.compile(studentSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { nis, fullName, gender, classId } = req.body;

    // Check if class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return res.status(404).json(response(404, 'Kelas tidak ditemukan'));
    }

    // Check if NIS already exists
    const nisExists = await Student.findOne({ where: { nis } });
    if (nisExists) {
      return res.status(409).json(response(409, 'NIS sudah digunakan'));
    }

    const newStudent = await Student.create({
      nis,
      fullName,
      gender,
      classId
    });

    return res.status(201).json(response(201, 'Siswa berhasil ditambahkan', newStudent));
  } catch (error) {
    console.error('Create Student Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// PUT update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.classId !== undefined) {
      req.body.classId = Number(req.body.classId);
    }

    const check = v.compile(updateStudentSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json(response(404, 'Siswa tidak ditemukan'));
    }

    const { nis, fullName, gender, classId } = req.body;

    // Check if class exists if classId is updated
    if (classId && classId !== student.classId) {
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        return res.status(404).json(response(404, 'Kelas tidak ditemukan'));
      }
    }

    // Check if NIS already exists for another student
    if (nis && nis !== student.nis) {
      const nisExists = await Student.findOne({ where: { nis } });
      if (nisExists) {
        return res.status(409).json(response(409, 'NIS sudah digunakan'));
      }
    }

    await student.update({
      nis: nis || student.nis,
      fullName: fullName || student.fullName,
      gender: gender || student.gender,
      classId: classId || student.classId
    });

    return res.status(200).json(response(200, 'Siswa berhasil diperbarui', student));
  } catch (error) {
    console.error('Update Student Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// DELETE student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json(response(404, 'Siswa tidak ditemukan'));
    }

    await student.destroy();
    return res.status(200).json(response(200, 'Siswa berhasil dihapus'));
  } catch (error) {
    console.error('Delete Student Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
