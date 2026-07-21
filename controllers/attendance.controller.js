const Validator = require('fastest-validator');
const { Attendance, Student, Class, Subject, User, sequelize } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const v = new Validator();

const createAttendanceSchema = {
  classId: { type: 'number', integer: true, positive: true },
  subjectId: { type: 'number', integer: true, positive: true },
  attendanceDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
  attendances: {
    type: 'array',
    min: 1,
    items: {
      type: 'object',
      props: {
        studentId: { type: 'number', integer: true, positive: true },
        status: { type: 'enum', values: ['present', 'permission', 'sick', 'absent'] },
        note: { type: 'string', optional: true, nullable: true }
      }
    }
  }
};

const updateAttendanceSchema = {
  status: { type: 'enum', values: ['present', 'permission', 'sick', 'absent'], optional: true },
  note: { type: 'string', optional: true, nullable: true },
  attendanceDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, optional: true }
};

// GET all attendances (riwayat absensi)
const getAllAttendances = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      attendanceDate,
      classId,
      subjectId,
      status,
      teacherId
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'attendanceDate';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Filters for Attendance table
    const whereCondition = {};

    if (attendanceDate) {
      whereCondition.attendanceDate = attendanceDate;
    } else if (startDate && endDate) {
      whereCondition.attendanceDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (classId) {
      whereCondition.classId = parseInt(classId);
    }

    if (subjectId) {
      whereCondition.subjectId = parseInt(subjectId);
    }

    if (status) {
      whereCondition.status = status;
    }

    if (teacherId) {
      whereCondition.teacherId = parseInt(teacherId);
    }

    // Include Student with search condition if search is provided
    const studentInclude = {
      model: Student,
      as: 'student',
      attributes: ['id', 'nis', 'fullName', 'gender']
    };

    if (search) {
      studentInclude.where = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { nis: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        studentInclude,
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'major', 'grade']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'code', 'name']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'nip', 'email']
        }
      ]
    });

    const totalPage = Math.ceil(count / limit);

    return res.status(200).json(response(200, 'Data absensi berhasil diambil', {
      attendances: rows,
      pagination: {
        page,
        limit,
        totalData: count,
        totalPage
      }
    }));
  } catch (error) {
    console.error('Get All Attendances Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// GET attendance detail
const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'nis', 'fullName', 'gender']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'major', 'grade']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'code', 'name']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'nip', 'email']
        }
      ]
    });

    if (!attendance) {
      return res.status(404).json(response(404, 'Data absensi tidak ditemukan'));
    }

    return res.status(200).json(response(200, 'Detail absensi berhasil diambil', attendance));
  } catch (error) {
    console.error('Get Attendance By Id Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// POST record batch attendances
const createAttendance = async (req, res) => {
  let transaction;
  try {
    if (req.body.classId !== undefined) req.body.classId = Number(req.body.classId);
    if (req.body.subjectId !== undefined) req.body.subjectId = Number(req.body.subjectId);

    if (req.body.attendances && Array.isArray(req.body.attendances)) {
      req.body.attendances = req.body.attendances.map(att => {
        return {
          ...att,
          studentId: att.studentId !== undefined ? Number(att.studentId) : undefined
        };
      });
    }

    // Validate main payload structure
    const check = v.compile(createAttendanceSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const { classId, subjectId, attendanceDate, attendances } = req.body;
    const teacherId = req.userId; // Taken from token middleware

    // 1. Verify Class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      return res.status(404).json(response(404, `Kelas dengan ID ${classId} tidak ditemukan`));
    }

    // 2. Verify Subject exists
    const subjectData = await Subject.findByPk(subjectId);
    if (!subjectData) {
      return res.status(404).json(response(404, `Mata pelajaran dengan ID ${subjectId} tidak ditemukan`));
    }

    // 3. Fetch all students belonging to this class
    const classStudents = await Student.findAll({
      where: { classId },
      attributes: ['id']
    });
    const validStudentIdsSet = new Set(classStudents.map(s => s.id));

    // 4. Validate students inside the payload
    const studentIdsInPayload = new Set();
    for (const att of attendances) {
      const { studentId } = att;

      // Check if student belongs to the selected class
      if (!validStudentIdsSet.has(studentId)) {
        return res.status(400).json(response(400, `Siswa dengan ID ${studentId} tidak terdaftar di kelas ${classData.name}`));
      }

      // Check for duplicate studentIds in the request body itself
      if (studentIdsInPayload.has(studentId)) {
        return res.status(400).json(response(400, `Siswa dengan ID ${studentId} muncul lebih dari satu kali dalam input absensi`));
      }
      studentIdsInPayload.add(studentId);

      // Check if attendance already exists in database for this student, subject, and date
      const attendanceExists = await Attendance.findOne({
        where: {
          studentId,
          subjectId,
          attendanceDate
        }
      });
      if (attendanceExists) {
        return res.status(409).json(
          response(409, `Siswa dengan ID ${studentId} sudah memiliki catatan absensi untuk mata pelajaran ini pada tanggal ${attendanceDate}`)
        );
      }
    }

    // 5. Run insertions inside a transaction
    transaction = await sequelize.transaction();

    const createdRecords = [];
    for (const att of attendances) {
      const record = await Attendance.create({
        studentId: att.studentId,
        classId,
        subjectId,
        teacherId,
        attendanceDate,
        status: att.status,
        note: att.note || null
      }, { transaction });
      createdRecords.push(record);
    }

    await transaction.commit();

    return res.status(201).json(response(201, 'Absensi berhasil disimpan', createdRecords));
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Create Attendance Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server saat memproses absensi'));
  }
};

// PUT update attendance
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const check = v.compile(updateAttendanceSchema)(req.body);
    if (check !== true) {
      return res.status(400).json(response(400, 'Validation failed', check));
    }

    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json(response(404, 'Data absensi tidak ditemukan'));
    }

    // Role check: If teacher, they can only edit their own attendance records
    if (req.userRole === 'teacher' && attendance.teacherId !== req.userId) {
      return res.status(403).json(response(403, 'Akses ditolak: Anda hanya dapat mengedit absensi yang Anda buat sendiri'));
    }

    const { status, note, attendanceDate } = req.body;

    const updatedData = {
      status: status || attendance.status,
      note: note !== undefined ? note : attendance.note,
      attendanceDate: attendanceDate || attendance.attendanceDate
    };

    // If date changes, check unique constraint again to avoid raw db error
    if (attendanceDate && attendanceDate !== attendance.attendanceDate) {
      const duplicate = await Attendance.findOne({
        where: {
          studentId: attendance.studentId,
          subjectId: attendance.subjectId,
          attendanceDate
        }
      });
      if (duplicate && duplicate.id !== attendance.id) {
        return res.status(409).json(response(409, 'Sudah ada data absensi untuk siswa ini pada tanggal tersebut'));
      }
    }

    await attendance.update(updatedData);

    return res.status(200).json(response(200, 'Data absensi berhasil diperbarui', attendance));
  } catch (error) {
    console.error('Update Attendance Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

// DELETE attendance
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json(response(404, 'Data absensi tidak ditemukan'));
    }

    // Role check: If teacher, they can only delete their own attendance records
    if (req.userRole === 'teacher' && attendance.teacherId !== req.userId) {
      return res.status(403).json(response(403, 'Akses ditolak: Anda hanya dapat menghapus absensi yang Anda buat sendiri'));
    }

    await attendance.destroy();
    return res.status(200).json(response(200, 'Data absensi berhasil dihapus'));
  } catch (error) {
    console.error('Delete Attendance Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getAllAttendances,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
