const Validator = require('fastest-validator');
const { Class, Student, sequelize } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const v = new Validator();

const classSchema = {
  name: { type: 'string', min: 1, empty: false },
  major: { type: 'string', min: 1, empty: false },
  grade: { type: 'number', enum: [10, 11, 12] },
  schoolYear: { type: 'string', min: 1, empty: false },
  homeroomTeacher: { type: 'string', min: 1, empty: false }
};

// Update schema has the same fields but they can be optional (though for completeness, full fields are fine)
const updateClassSchema = {
  name: { type: 'string', min: 1, empty: false, optional: true },
  major: { type: 'string', min: 1, empty: false, optional: true },
  grade: { type: 'number', enum: [10, 11, 12], optional: true },
  schoolYear: { type: 'string', min: 1, empty: false, optional: true },
  homeroomTeacher: { type: 'string', min: 1, empty: false, optional: true }
};

// GET all classes
const getAllClasses = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;

    // Search condition
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { major: { [Op.like]: `%${search}%` } },
          { homeroomTeacher: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await Class.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, sortOrder]]
    });

    const totalPage = Math.ceil(count / limit);

    return res.status(200).json(response(200, 'Data kelas berhasil diambil', {
      classes: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage
      }
    }));
  } catch (error) {
    console.error('Get All Classes Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// GET class detail
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await Class.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'students'
        }
      ]
    });

    if (!classData) {
      return res.status(404).json(response(404, 'Kelas tidak ditemukan'));
    }

    return res.status(200).json(response(200, 'Detail kelas berhasil diambil', classData));
  } catch (error) {
    console.error('Get Class By Id Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// POST create class
const createClass = async (req, res) => {
  try {
    // If grade is passed as string from request body, convert it to integer
    if (req.body.grade !== undefined) {
      req.body.grade = Number(req.body.grade);
    }

    const check = v.compile(classSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { name, major, grade, schoolYear, homeroomTeacher } = req.body;
    const newClass = await Class.create({
      name,
      major,
      grade,
      schoolYear,
      homeroomTeacher
    });

    return res.status(201).json(response(201, 'Kelas berhasil ditambahkan', newClass));
  } catch (error) {
    console.error('Create Class Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// PUT update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.grade !== undefined) {
      req.body.grade = Number(req.body.grade);
    }

    const check = v.compile(updateClassSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const classData = await Class.findByPk(id);
    if (!classData) {
      return res.status(404).json(response(404, 'Kelas tidak ditemukan'));
    }

    const { name, major, grade, schoolYear, homeroomTeacher } = req.body;
    await classData.update({
      name: name || classData.name,
      major: major || classData.major,
      grade: grade || classData.grade,
      schoolYear: schoolYear || classData.schoolYear,
      homeroomTeacher: homeroomTeacher || classData.homeroomTeacher
    });

    return res.status(200).json(response(200, 'Kelas berhasil diperbarui', classData));
  } catch (error) {
    console.error('Update Class Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// DELETE class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await Class.findByPk(id);
    if (!classData) {
      return res.status(404).json(response(404, 'Kelas tidak ditemukan'));
    }

    // Check if class has students
    const studentCount = await Student.count({ where: { classId: id } });
    if (studentCount > 0) {
      return res.status(409).json(response(409, 'Kelas tidak boleh dihapus karena masih memiliki siswa'));
    }

    await classData.destroy();
    return res.status(200).json(response(200, 'Kelas berhasil dihapus'));
  } catch (error) {
    console.error('Delete Class Error:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json(response(409, 'Kelas tidak boleh dihapus karena masih digunakan oleh data lain'));
    }
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
